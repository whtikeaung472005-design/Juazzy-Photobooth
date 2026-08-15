/* Filename: src/hooks/useWebcam.js */
import { useState, useEffect, useRef } from 'react';

export function useWebcam() {
  const videoRef = useRef(null);
  const [streamData, setStreamData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activeStream = null;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false
        });
        activeStream = stream;
        setStreamData(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(err.message || "Camera access denied or not available.");
      }
    };

    startWebcam();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return { videoRef, streamData, error };
}