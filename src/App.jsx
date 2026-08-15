/* Filename: src/App.jsx */
import React, { useState, useCallback } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { generatePhotoStrip, downloadImage } from './utils/imageProcessing';

export default function App() {
  const { videoRef, error } = useWebcam();
  
  // Advanced Custom Filters State
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    hue: 0
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [flash, setFlash] = useState(false);
  const [finalStrip, setFinalStrip] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const maxPhotos = 4;

  // Generate dynamic CSS filter string based on state
  const getFilterString = useCallback(() => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) hue-rotate(${filters.hue}deg)`;
  }, [filters]);

  // Handle slider changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: Number(value) }));
  };

  // Reset all filters to default
  const resetFilters = () => {
    setFilters({ brightness: 100, contrast: 100, saturation: 100, sepia: 0, hue: 0 });
  };

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 🔥 BURN-IN TECHNIQUE: Apply exact same CSS filter to Canvas Context before drawing
    ctx.filter = getFilterString();
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/png');
  }, [videoRef, getFilterString]);

  const startSession = async () => {
    setPhotos([]);
    setFinalStrip(null);
    setIsCapturing(true);
    let capturedPhotos = [];

    for (let i = 0; i < maxPhotos; i++) {
      // Countdown phase
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setCountdown(null);
      
      // Trigger Flash UI
      setFlash(true);
      setTimeout(() => setFlash(false), 500);

      // Capture Image with filters burned in
      const photoDataUrl = takePhoto();
      if (photoDataUrl) {
        capturedPhotos.push(photoDataUrl);
        setPhotos([...capturedPhotos]);
      }
      
      if (i < maxPhotos - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    setIsCapturing(false);
    setIsProcessing(true);
    
    // Process Final Strip (No need to pass filter, it's already burned in)
    try {
      const stripDataUrl = await generatePhotoStrip(capturedPhotos);
      setFinalStrip(stripDataUrl);
    } catch (err) {
      console.error("Failed to generate photo strip:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Juazzy Photobooth</h1>
        <p className="text-gray-500 mt-2">Professional Grade & Custom Filters</p>
      </header>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-xl text-center">
          <p><strong>Error:</strong> {error}</p>
          <p className="text-sm">Please allow camera permissions.</p>
        </div>
      ) : (
        <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Camera Preview & Filters */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-6">
            <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl aspect-[4/3] border-4 border-gray-800">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transition-all duration-100"
                style={{ filter: getFilterString() }}
              />
              
              {/* Flash Overlay */}
              {flash && <div className="absolute inset-0 bg-white animate-flash z-10 pointer-events-none"></div>}
              
              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <span className="text-white text-9xl font-bold drop-shadow-2xl">{countdown}</span>
                </div>
              )}
            </div>

            {/* Custom Filter Controls Panel */}
            <div className="w-full bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Adjust Colors</h3>
                <button onClick={resetFilters} disabled={isCapturing} className="text-sm text-blue-600 hover:underline">Reset</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                {/* Brightness */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <label>Brightness</label>
                    <span>{filters.brightness}%</span>
                  </div>
                  <input type="range" name="brightness" min="50" max="150" value={filters.brightness} onChange={handleFilterChange} disabled={isCapturing} className="w-full accent-blue-600" />
                </div>
                {/* Contrast */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <label>Contrast</label>
                    <span>{filters.contrast}%</span>
                  </div>
                  <input type="range" name="contrast" min="50" max="200" value={filters.contrast} onChange={handleFilterChange} disabled={isCapturing} className="w-full accent-blue-600" />
                </div>
                {/* Saturation */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <label>Saturation</label>
                    <span>{filters.saturation}%</span>
                  </div>
                  <input type="range" name="saturation" min="0" max="200" value={filters.saturation} onChange={handleFilterChange} disabled={isCapturing} className="w-full accent-blue-600" />
                </div>
                {/* Sepia */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <label>Sepia Tone</label>
                    <span>{filters.sepia}%</span>
                  </div>
                  <input type="range" name="sepia" min="0" max="100" value={filters.sepia} onChange={handleFilterChange} disabled={isCapturing} className="w-full accent-orange-500" />
                </div>
                {/* Hue Rotate */}
                <div className="flex flex-col space-y-1 md:col-span-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <label>Hue Shift</label>
                    <span>{filters.hue}°</span>
                  </div>
                  <input type="range" name="hue" min="-180" max="180" value={filters.hue} onChange={handleFilterChange} disabled={isCapturing} className="w-full accent-purple-500" />
                </div>
              </div>
              
              <button 
                onClick={startSession}
                disabled={isCapturing || isProcessing}
                className={`w-full py-4 rounded-lg text-white font-bold text-lg tracking-wide transition-all ${
                  isCapturing || isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 shadow-xl hover:shadow-red-500/30 active:scale-[0.98]'
                }`}
              >
                {isCapturing ? '📷 Session in Progress...' : 'Start Photo Session (4 Shots)'}
              </button>
            </div>
          </div>

          {/* Right Column: Result / Photo Strip */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[600px]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b-2 border-gray-100 pb-3 w-full text-center uppercase tracking-wider">Your Photo Strip</h2>
            
            {!finalStrip && !isCapturing && photos.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center px-8 space-y-4">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p>Adjust your perfect colors and start the session to see your memory strip here.</p>
              </div>
            )}

            {isCapturing && photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 w-full">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative aspect-[4/3] bg-gray-100 p-2 shadow-sm border border-gray-200">
                    <img src={src} alt={`Shot ${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {isProcessing && (
              <div className="mt-12 flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-600 font-semibold animate-pulse">Rendering your photo strip...</p>
              </div>
            )}

            {finalStrip && (
              <div className="flex flex-col items-center space-y-6 w-full animate-fade-in-up">
                <img 
                  src={finalStrip} 
                  alt="Final Photo Strip" 
                  className="max-h-[700px] w-auto shadow-2xl rounded-sm border-4 border-white"
                />
                <button 
                  onClick={() => downloadImage(finalStrip)}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span>Download Strip</span>
                </button>
              </div>
            )}
          </div>

        </main>
      )}
    </div>
  );
}