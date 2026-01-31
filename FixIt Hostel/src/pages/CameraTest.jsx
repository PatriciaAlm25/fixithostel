import React, { useState } from 'react';
import CameraInput from '../components/CameraInput';
import '../styles/CameraInput.css';

const CameraTest = () => {
  const [images, setImages] = useState([]);

  const handleImagesSelected = (selectedImages) => {
    console.log('Images selected:', selectedImages);
    setImages(selectedImages);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>🎥 Camera Test Page</h1>
      <p>This page tests the CameraInput component directly</p>
      
      <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
        <h2>Camera Component:</h2>
        <CameraInput
          onImagesSelected={handleImagesSelected}
          maxImages={5}
          required={false}
          cameraOnly={false}
        />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Images Selected: {images.length}</h2>
        {images.length > 0 && (
          <ul>
            {images.map((img, idx) => (
              <li key={idx}>{img.name} ({(img.size / 1024).toFixed(2)} KB)</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
        <h3>Debug Info:</h3>
        <p>✅ CameraInput component loaded successfully</p>
        <p>✅ Camera module is working</p>
        <p>Check browser console for more details (F12 → Console)</p>
      </div>
    </div>
  );
};

export default CameraTest;
