import React, { useState, useRef, useEffect } from 'react';
import '../styles/CameraInput.css';

const CameraInput = ({ onImagesSelected, maxImages = 5, required = false, cameraOnly = false }) => {
  console.log('✅ CameraInput component loaded with props:', { onImagesSelected, maxImages, required, cameraOnly });
  const [images, setImages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [streamEvents, setStreamEvents] = useState([]);
  const [autoRestartAttempts, setAutoRestartAttempts] = useState(0);
  const MAX_AUTO_RESTART = 3;
  const streamRef = useRef(null);
  const trackListenerRef = useRef(new Map());
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const fallbackBtnRef = useRef(null);

  // Debug: Log when cameraActive changes
  useEffect(() => {
    console.log('%cCAMERA ACTIVE STATE CHANGED:', 'color: orange; font-weight: bold;', cameraActive);
  }, [cameraActive]);

  const startCamera = async () => {
    console.log('%c🎥 START CAMERA CALLED', 'color: blue; font-size: 14px; font-weight: bold;');
    console.log('videoRef.current exists?', !!videoRef.current);
    setCameraError('');
    
    // Ensure camera state is set to active FIRST so video element renders
    setCameraActive(true);
    
    // Wait a tick for DOM to render
    await new Promise(r => setTimeout(r, 50));
    
    try {
      // First, try with environment facing mode (back camera on mobile)
      let stream;
      try {
        console.log('Attempting to get environment camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
        console.log('✓ Environment camera obtained');
      } catch (envErr) {
        // Fallback to any available camera
        console.warn('Environment camera not available, trying any camera:', envErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
        console.log('✓ Fallback camera obtained');
      }
      
      console.log('After getUserMedia, videoRef.current exists?', !!videoRef.current);
      
      if (!videoRef.current) {
        console.error('❌ CRITICAL: videoRef.current is null! Video element not found in DOM');
        setCameraError('Video element not initialized. Please close and reopen camera.');
        throw new Error('Video element not found');
      }
      
      console.log('✓ Setting video srcObject...');
      videoRef.current.srcObject = stream;
      console.log('Video element:', {
        current: videoRef.current,
        src: videoRef.current.srcObject,
        width: videoRef.current.width,
        height: videoRef.current.height,
        offsetWidth: videoRef.current.offsetWidth,
        offsetHeight: videoRef.current.offsetHeight,
        style: window.getComputedStyle(videoRef.current)
      });
      
      // store stream ref
      streamRef.current = stream;
      // attach listeners to stream and tracks
      attachStreamEventListeners(stream);
        // store stream ref
        streamRef.current = stream;
        // attach listeners to stream and tracks
        attachStreamEventListeners(stream);
        
        // Wait for video metadata and attempt to start playback
        await new Promise((resolve) => {
          const handleLoadedMetadata = async () => {
            try {
              console.log('✓ Video loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              // Attempt to play the video (some browsers require explicit play())
              const playPromise = videoRef.current.play();
              if (playPromise && typeof playPromise.then === 'function') {
                await playPromise.catch((pErr) => console.warn('Video play() rejected:', pErr));
              }
            } catch (playErr) {
              console.warn('Error during video play:', playErr);
            } finally {
              videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
              resolve();
            }
          };
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          // Fallback timeout: resolve after 3 seconds even if loadedmetadata did not fire
          setTimeout(async () => {
            try {
              if (videoRef.current && videoRef.current.paused) {
                const playPromise = videoRef.current.play();
                if (playPromise && typeof playPromise.then === 'function') {
                  await playPromise.catch((pErr) => console.warn('Video play() rejected on timeout fallback:', pErr));
                }
              }
            } catch (err) {
              console.warn('Fallback play() error:', err);
            }
            resolve();
          }, 3000);
        });

        console.log('%c✅ CAMERA ACTIVE - Button should be visible', 'color: green; font-size: 14px; font-weight: bold;');
        setCameraActive(true);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      let errorMessage = 'Could not access camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Camera access requires HTTPS (or localhost for development).';
      }
      
      setCameraError(errorMessage);
      console.error('Camera error details:', err.name, err.message);
    }
  };

  const restartCamera = async (reason) => {
    if (autoRestartAttempts >= MAX_AUTO_RESTART) {
      setStreamEvents((s) => [{ id: Date.now(), msg: `${new Date().toLocaleTimeString()} - auto-restart aborted (max attempts): ${reason}` }, ...s].slice(0, 10));
      return;
    }
    setAutoRestartAttempts((n) => n + 1);
    setStreamEvents((s) => [{ id: Date.now(), msg: `${new Date().toLocaleTimeString()} - attempting auto-restart (${autoRestartAttempts + 1}) - ${reason}` }, ...s].slice(0, 10));
    try {
      await stopCamera();
      // small delay before retrying
      await new Promise((r) => setTimeout(r, 700));
      await startCamera();
      setStreamEvents((s) => [{ id: Date.now(), msg: `${new Date().toLocaleTimeString()} - auto-restart successful` }, ...s].slice(0, 10));
      setAutoRestartAttempts(0);
    } catch (err) {
      setStreamEvents((s) => [{ id: Date.now(), msg: `${new Date().toLocaleTimeString()} - auto-restart failed: ${err?.message || err}` }, ...s].slice(0, 10));
      // schedule another attempt with backoff
      setTimeout(() => scheduleRestart(`retry after failure: ${reason}`), 1500);
    }
  };

  const scheduleRestart = (reason) => {
    if (autoRestartAttempts >= MAX_AUTO_RESTART) {
      setStreamEvents((s) => [{ id: Date.now(), msg: `${new Date().toLocaleTimeString()} - will not restart (max attempts): ${reason}` }, ...s].slice(0, 10));
      return;
    }
    // debounce scheduling so we don't flood retries
    setTimeout(() => restartCamera(reason), 500);
  };

  const attachStreamEventListeners = (stream) => {
    if (!stream) return;

    const pushEvent = (msg) => {
      setStreamEvents((prev) => {
        const next = [ `${new Date().toLocaleTimeString()} - ${msg}`, ...prev ].slice(0, 10);
        return next;
      });
      console.log('STREAM EVENT:', msg);
    };

    // stream inactive
    const inactiveHandler = () => { pushEvent('stream inactive'); scheduleRestart('stream inactive'); };
    try {
      stream.addEventListener && stream.addEventListener('inactive', inactiveHandler);
    } catch (e) {
      // some browsers don't support addEventListener on MediaStream
    }

    // Attach track listeners
    stream.getTracks().forEach((track) => {
      const handlers = {};
      handlers.ended = () => { pushEvent(`track ended (${track.kind})`); scheduleRestart(`track ended (${track.kind})`); };
      handlers.mute = () => pushEvent(`track muted (${track.kind})`);
      handlers.unmute = () => pushEvent(`track unmuted (${track.kind})`);
      handlers.overconstrained = (ev) => { pushEvent(`overconstrained: ${ev.constraint || 'unknown'}`); scheduleRestart('overconstrained'); };

      // add listeners
      try { track.addEventListener('ended', handlers.ended); } catch(e){ track.onended = handlers.ended; }
      try { track.addEventListener('mute', handlers.mute); } catch(e){ track.onmute = handlers.mute; }
      try { track.addEventListener('unmute', handlers.unmute); } catch(e){ track.onunmute = handlers.unmute; }
      try { track.addEventListener('overconstrained', handlers.overconstrained); } catch(e){ /* ignore */ }

      trackListenerRef.current.set(track.id, { track, handlers });
      pushEvent(`listener attached to track ${track.kind} (${track.id})`);
    });
  };

  const stopCamera = () => {
    // remove listeners
    try {
      if (streamRef.current) {
        try { streamRef.current.removeEventListener && streamRef.current.removeEventListener('inactive', () => {}); } catch(e){}
        streamRef.current = null;
      }
    } catch(e){}

    // stop tracks and cleanup listeners
    trackListenerRef.current.forEach(({ track, handlers }, id) => {
      try {
        try { track.removeEventListener && track.removeEventListener('ended', handlers.ended); } catch(e){ track.onended = null; }
        try { track.removeEventListener && track.removeEventListener('mute', handlers.mute); } catch(e){ track.onmute = null; }
        try { track.removeEventListener && track.removeEventListener('unmute', handlers.unmute); } catch(e){ track.onunmute = null; }
      } catch (e) { console.warn('Error removing track listeners', e); }
      try { track.stop(); } catch(e){}
    });
    trackListenerRef.current.clear();

    if (videoRef.current?.srcObject) {
      try { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); } catch(e){}
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCameraError('');
    // remove any existing fallback button
    try {
      if (fallbackBtnRef.current && document.body.contains(fallbackBtnRef.current)) {
        fallbackBtnRef.current.removeEventListener('click', capturePhoto);
        document.body.removeChild(fallbackBtnRef.current);
        fallbackBtnRef.current = null;
      }
    } catch (e) { /* ignore cleanup errors */ }
  };

  const capturePhoto = () => {
    try {
      setIsCapturing(true);
      console.log('%c📸 CAPTURE STARTED', 'color: blue; font-size: 14px; font-weight: bold;');
      
      if (images.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        setIsCapturing(false);
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        console.error('Canvas or video element not available');
        setCameraError('Camera not properly initialized. Please close and reopen the camera.');
        setIsCapturing(false);
        return;
      }

      // Check if video has actual dimensions
      if (!video.videoWidth || !video.videoHeight) {
        console.error('Video dimensions not available. Width:', video.videoWidth, 'Height:', video.videoHeight);
        setCameraError('Camera stream not ready. Please wait a moment and try again.');
        setIsCapturing(false);
        return;
      }

      console.log('✓ Video dimensions:', video.videoWidth, 'x', video.videoHeight);

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get canvas context');
        setCameraError('Canvas context error. Please try again.');
        setIsCapturing(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      console.log('✓ Frame drawn to canvas');

      // Convert canvas to blob with proper error handling
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            setCameraError('Failed to capture photo. Please try again.');
            setIsCapturing(false);
            return;
          }

          console.log('%c✓ Blob created', 'color: green;', 'Size:', blob.size, 'bytes');
          const filename = `capture-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: 'image/jpeg' });
          console.log('✓ File object created:', filename);
          
          addImage(file);
          console.log('%c✓ CAPTURE COMPLETED SUCCESSFULLY', 'color: green; font-size: 14px; font-weight: bold;');
          setIsCapturing(false);
          setCameraError('');
        },
        'image/jpeg',
        0.95 // Quality: 95%
      );
    } catch (err) {
      console.error('Error capturing photo:', err);
      setCameraError(`Capture error: ${err.message}`);
      setIsCapturing(false);
    }
  };

  // Persistent fallback button appended to body so it's always visible.
  // Button starts camera when inactive, and captures when active.
  useEffect(() => {
    if (!fallbackBtnRef.current) {
      const btn = document.createElement('button');
      btn.className = 'capture-btn-fallback-portal';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Capture image (fallback)');
      btn.innerText = '📷';
      Object.assign(btn.style, {
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        zIndex: 2147483647,
        background: '#28a745',
        color: '#fff',
        border: '3px solid #fff',
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(40,167,69,0.45)'
      });

      const handler = () => {
        // if camera not active, start it; otherwise capture
        if (!cameraActive) {
          startCamera();
        } else {
          capturePhoto();
        }
      };

      btn.addEventListener('click', handler);
      document.body.appendChild(btn);
      fallbackBtnRef.current = btn;
      fallbackBtnRef.current._handler = handler;
    }

    const update = () => {
      const btn = fallbackBtnRef.current;
      if (!btn) return;
      btn.disabled = images.length >= maxImages || isCapturing;
      btn.style.opacity = btn.disabled ? '0.6' : '1';
      btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
      btn.innerText = cameraActive ? (isCapturing ? '⏳' : '📸') : '📷';
    };

    // initial update and periodic updater (keeps HMR/simple state in sync)
    update();
    const interval = setInterval(update, 250);

    return () => {
      clearInterval(interval);
      try {
        const btn = fallbackBtnRef.current;
        if (btn) {
          btn.removeEventListener('click', btn._handler || capturePhoto);
          if (document.body.contains(btn)) document.body.removeChild(btn);
        }
      } catch (e) { /* ignore */ }
      fallbackBtnRef.current = null;
    };
  }, [cameraActive, images.length, isCapturing, maxImages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      alert(`Cannot select more than ${maxImages} images total`);
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addImage(file);
      }
    });
  };

  const addImage = (file) => {
    console.log('Adding image:', file.name, 'Size:', file.size, 'bytes');
    
    if (!file) {
      console.error('No file provided to addImage');
      setCameraError('File error: No file provided');
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      setCameraError('Failed to read image file');
    };

    reader.onload = (e) => {
      try {
        const dataUrl = e.target.result;
        
        if (!dataUrl) {
          console.error('DataURL is null or undefined');
          setCameraError('Failed to process image data');
          return;
        }

        console.log('DataURL created, length:', dataUrl.length);

        const newImage = {
          id: Date.now() + Math.random(), // Use random to avoid ID collisions
          src: dataUrl,
          file: file,
          name: file.name,
        };

        setImages((prevImages) => {
          const updatedImages = [...prevImages, newImage];
          console.log('Images updated. Total:', updatedImages.length);
          
          // Call callback with updated images
          onImagesSelected(updatedImages.map(img => img.file));
          
          return updatedImages;
        });
      } catch (err) {
        console.error('Error in FileReader onload:', err);
        setCameraError('Failed to process image');
      }
    };

    try {
      reader.readAsDataURL(file);
      console.log('FileReader started reading file');
    } catch (err) {
      console.error('Error starting FileReader:', err);
      setCameraError('Failed to read image file');
    }
  };

  const removeImage = (id) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesSelected(updatedImages.map(img => img.file));
  };

  return (
    <div className="camera-input-container">
      <div className="camera-section">
        {cameraError && (
          <div className="camera-error-alert">
            <strong>⚠️ Camera Error:</strong> {cameraError}
            <button 
              type="button" 
              className="error-dismiss-btn"
              onClick={() => setCameraError('')}
            >
              ✕
            </button>
          </div>
        )}
        {!cameraActive ? (
          <div className="camera-start">
            <div className="camera-options">
              <button
                type="button"
                className="camera-btn camera-capture-btn"
                onClick={startCamera}
                title="Open camera to take photos"
              >
                📷 Take Photo
              </button>
              {!cameraOnly && (
                <button
                  type="button"
                  className="camera-btn camera-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photo from device"
                >
                  📁 Upload Photo
                </button>
              )}
            </div>
            {!cameraOnly && (
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            )}
          </div>
        ) : (
          <div style={{
            border: '5px solid red',
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px'
          }}>
            <div style={{fontSize: '16px', color: '#d00', fontWeight: 'bold', marginBottom: '1rem'}}>
              🎥 CAMERA STREAM ACTIVE - YOU SHOULD SEE VIDEO BELOW
            </div>
            <div className="camera-active" style={{position: 'relative'}}>
            <div style={{fontSize: '14px', color: '#333', margin: '1rem 0', textAlign: 'center', fontWeight: 'bold'}}>
              📹 CAMERA IS ACTIVE - Look for the green button below
            </div>
            <div className="video-container" style={{
              position: 'relative',
              width: '100%',
              height: '450px',
              background: '#000',
              borderRadius: '8px',
              border: '3px solid #ccc'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                className="camera-preview"
              />
              
              {/* Large overlay capture button - inline styles with high priority */}
              <button
                type="button"
                className="capture-btn-overlay"
                onClick={() => {
                  console.log('CAPTURE BUTTON CLICKED!');
                  capturePhoto();
                }}
                disabled={images.length >= maxImages || isCapturing}
                title="Click to capture photo"
                style={{
                  position: 'absolute',
                  bottom: '30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: '#28a745',
                  border: '8px solid white',
                  color: 'white',
                  cursor: images.length >= maxImages || isCapturing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  zIndex: 9999,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 0 3px rgba(40, 167, 69, 0.6)',
                  pointerEvents: images.length >= maxImages || isCapturing ? 'none' : 'auto',
                  margin: 0,
                  padding: 0,
                  fontSize: '2rem',
                  opacity: images.length >= maxImages || isCapturing ? 0.6 : 1
                }}
              >
                {isCapturing ? '⏳' : '📸'}
              </button>
            </div>
            
            <div style={{marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
              <button
                type="button"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: images.length >= maxImages || isCapturing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  opacity: images.length >= maxImages || isCapturing ? 0.6 : 1
                }}
                onClick={() => {
                  console.log('CAPTURE BUTTON (below) CLICKED!');
                  capturePhoto();
                }}
                disabled={images.length >= maxImages || isCapturing}
              >
                {isCapturing ? '⏳ Capturing...' : '📸 Capture'}
              </button>
              <button
                type="button"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
                onClick={stopCamera}
              >
                ✕ Close
              </button>
            </div>
          </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {streamEvents.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4>Camera Stream Events</h4>
          <ul style={{ maxHeight: 160, overflow: 'auto', paddingLeft: 16 }}>
            {streamEvents.map((e, idx) => (
              <li key={idx} style={{ fontSize: 12 }}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {images.length > 0 && (
        <div className="images-preview">
          <h4>Selected Images ({images.length}/{maxImages})</h4>
          <div className="preview-grid">
            {images.map((image) => (
              <div key={image.id} className="preview-item">
                <img src={image.src} alt={image.name} />
                <a
                  href={image.src}
                  download={image.name}
                  className="download-btn"
                  title="Download image"
                >
                  ⬇
                </a>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeImage(image.id)}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {required && images.length === 0 && (
        <div className="camera-warning">
          ⚠️ At least one image is required
        </div>
      )}
    </div>
  );
};

export default CameraInput;
