import React, { useState, useRef } from 'react';

const SimpleCameraTest = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [images, setImages] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraError('');
        console.log('✅ Camera started successfully');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(`Error: ${err.message}`);
    }
  };

  const capturePhoto = () => {
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video || !video.videoWidth) {
        setCameraError('Camera not ready');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const reader = new FileReader();
          reader.onload = (e) => {
            setImages([...images, { id: Date.now(), src: e.target.result, name: file.name }]);
            setCameraError('');
            console.log('✅ Photo captured');
          };
          reader.readAsDataURL(file);
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError(`Capture error: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', fontFamily: 'Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>🎥 Camera Test - See Your Preview</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Click "Take Photo" to start your camera, then use the CAPTURE button</p>

      {cameraError && (
        <div style={{ padding: '1rem', background: '#ffebee', border: '3px solid #ef5350', borderRadius: '4px', marginBottom: '2rem', color: '#c62828', fontSize: '1.1rem' }}>
          ⚠️ ERROR: {cameraError}
        </div>
      )}

      {!cameraActive ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
          <button
            onClick={startCamera}
            style={{
              padding: '1.5rem 3rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            📷 Take Photo
          </button>
          <p style={{ marginTop: '1rem', color: '#999', fontSize: '0.9rem' }}>
            Click the button above to activate your camera
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.2rem' }}>📹 Camera Preview - See What You're Capturing:</h2>
            <div style={{
              position: 'relative',
              width: '100%',
              background: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '1.5rem',
              border: '3px solid #28a745'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '400px',
                  maxHeight: '600px',
                  display: 'block',
                  backgroundColor: '#000'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(40, 167, 69, 0.8)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                🔴 LIVE
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={capturePhoto}
              style={{
                padding: '1.2rem 2rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                background: '#28a745',
                color: 'white',
                border: '3px solid #1e7e34',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(40, 167, 69, 0.5)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 8px 24px rgba(40, 167, 69, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.5)';
              }}
            >
              📸 CAPTURE IMAGE
            </button>

            <button
              onClick={stopCamera}
              style={{
                padding: '1.2rem 2rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                background: '#dc3545',
                color: 'white',
                border: '3px solid #bb2d3b',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(220, 53, 69, 0.5)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 8px 24px rgba(220, 53, 69, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.5)';
              }}
            >
              ✕ Close Camera
            </button>
          </div>

          <div style={{ 
            background: '#e8f5e9', 
            padding: '1rem', 
            borderRadius: '4px',
            borderLeft: '4px solid #28a745',
            color: '#2e7d32'
          }}>
            <strong>💡 Tip:</strong> Position your camera to see what you want to capture in the preview above, then click the <strong>green CAPTURE button</strong> to take the photo.
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ color: '#333', fontSize: '1.3rem', marginBottom: '1.5rem' }}>✅ Photos Captured ({images.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
            {images.map((img, idx) => (
              <div key={img.id} style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '2px solid #28a745'
              }}>
                <img src={img.src} alt={`Captured ${idx + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'rgba(40, 167, 69, 0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white',
                  opacity: 0,
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(40, 167, 69, 0.8)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(40, 167, 69, 0)';
                  e.currentTarget.style.opacity = '0';
                }}
                >
                  ✅
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1565c0' }}>ℹ️ Status Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '1rem' }}>
          <div>
            <strong>Camera Status:</strong>
            <div style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: cameraActive ? '#28a745' : '#999' }}>
              {cameraActive ? '✅ ACTIVE - Camera is running' : '⭕ INACTIVE - Click "Take Photo" to start'}
            </div>
          </div>
          <div>
            <strong>Photos Captured:</strong>
            <div style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: '#2196f3' }}>
              {images.length} photo{images.length !== 1 ? 's' : ''}
            </div>
          </div>
          {cameraError && (
            <div>
              <strong>Error:</strong>
              <div style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#d32f2f' }}>
                {cameraError}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCameraTest;
