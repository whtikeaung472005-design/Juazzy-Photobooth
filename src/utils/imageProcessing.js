/* Filename: src/utils/imageProcessing.js */

// Helper to load image asynchronously
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const generatePhotoStrip = async (imageSrcArray) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Configuration for the photo strip
  const imgWidth = 600;
  const imgHeight = 400;
  const padding = 40;
  const bottomPadding = 120; // Extra space for watermark
  
  // Calculate total canvas size
  canvas.width = imgWidth + (padding * 2);
  canvas.height = (imgHeight * 4) + (padding * 5) + bottomPadding;

  // Background color (White like Polaroid/Photo strip)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each image onto the master canvas
  // Note: Images already have filters applied (burned-in) from App.jsx
  for (let i = 0; i < imageSrcArray.length; i++) {
    const img = await loadImage(imageSrcArray[i]);
    const yPos = padding + (i * (imgHeight + padding));
    
    // Draw image maintaining ratio or stretch to fit
    ctx.drawImage(img, padding, yPos, imgWidth, imgHeight);
    
    // Draw a subtle inner border for realism
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, yPos, imgWidth, imgHeight);
  }

  // Add Brand Watermark at the bottom
  ctx.fillStyle = '#111827'; // Dark text
  ctx.font = 'bold 36px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const textX = canvas.width / 2;
  const textY = canvas.height - (bottomPadding / 2);
  
  ctx.fillText("Juazzy Photobooth", textX, textY);
  
  // Date watermark
  ctx.font = '16px "Courier New", Courier, monospace';
  ctx.fillStyle = '#6b7280'; // Gray text
  ctx.fillText(new Date().toLocaleDateString(), textX, textY + 30);

  // Export as high-quality JPEG
  return canvas.toDataURL('image/jpeg', 0.95);
};

export const downloadImage = (dataUrl, filename = 'juazzy-photostrip.jpg') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};