import React, { useState, useRef, useEffect } from 'react';
import CameraInput from '../components/CameraInput';
import '../styles/CameraDiagnostics.css';

const CameraDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    browserSupport: null,
    mediaDevicesAPI: null,
    getUserMediaSupport: null,
    cameraAvailable: null,
    cameraPermission: null,
    currentError: null,
  });
  const [testResults, setTestResults] = useState([]);
  const videoRef = useRef(null);
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [quickLog, setQuickLog] = useState([]);

  useEffect(() => {
    runInitialDiagnostics();
  }, []);

  const runInitialDiagnostics = async () => {
    const results = [];

    // 1. Check browser support
    const isBrowserSupported = !!navigator && !!window;
    results.push({
      test: 'Browser Support',
      status: isBrowserSupported ? 'PASS' : 'FAIL',
      message: isBrowserSupported
        ? `Your browser is supported (${navigator.userAgent.split(' ').pop()})`
        : 'Browser not supported',
    });

    // 2. Check mediaDevices API
    const hasMediaDevices = !!navigator.mediaDevices;
    results.push({
      test: 'MediaDevices API',
      status: hasMediaDevices ? 'PASS' : 'FAIL',
      message: hasMediaDevices
        ? 'navigator.mediaDevices is available'
        : 'navigator.mediaDevices NOT available - upgrade your browser',
    });

    // 3. Check getUserMedia support
    const hasGetUserMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    results.push({
      test: 'getUserMedia Support',
      status: hasGetUserMedia ? 'PASS' : 'FAIL',
      message: hasGetUserMedia
        ? 'getUserMedia is available'
        : 'getUserMedia NOT available',
    });

    // 4. Check enumeration support
    const hasEnumerateDevices = !!(
      navigator.mediaDevices && navigator.mediaDevices.enumerateDevices
    );
    results.push({
      test: 'Enumerate Devices Support',
      status: hasEnumerateDevices ? 'PASS' : 'FAIL',
      message: hasEnumerateDevices
        ? 'enumerateDevices is available'
        : 'Cannot enumerate devices',
    });

    // 5. Check for camera devices
    if (hasEnumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        const audioDevices = devices.filter((device) => device.kind === 'audioinput');

        results.push({
          test: 'Camera Devices Found',
          status: videoDevices.length > 0 ? 'PASS' : 'FAIL',
          message: videoDevices.length > 0
            ? `Found ${videoDevices.length} camera(s): ${videoDevices.map((d) => d.label || 'Unknown').join(', ')}`
            : 'No camera devices found on this system',
        });

        results.push({
          test: 'Microphone Devices Found',
          status: audioDevices.length > 0 ? 'PASS' : 'FAIL',
          message: audioDevices.length > 0
            ? `Found ${audioDevices.length} microphone(s): ${audioDevices.map((d) => d.label || 'Unknown').join(', ')}`
            : 'No microphone devices found',
        });
      } catch (err) {
        results.push({
          test: 'Camera Devices Found',
          status: 'FAIL',
          message: `Error enumerating devices: ${err.message}`,
        });
      }
    }

    // 6. Check HTTPS/localhost requirement
    const isSecureContext = window.isSecureContext;
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '::1';

    results.push({
      test: 'HTTPS/Localhost Check',
      status: isSecureContext || isLocalhost ? 'PASS' : 'FAIL',
      message:
        isSecureContext || isLocalhost
          ? `✓ Secure context or localhost (${window.location.protocol}//${window.location.hostname})`
          : `✗ Not secure context. URL: ${window.location.protocol}//${window.location.hostname}. Camera requires HTTPS or localhost.`,
    });

    // 7. Check for permissions API
    const hasPermissionsAPI = !!navigator.permissions;
    results.push({
      test: 'Permissions API',
      status: hasPermissionsAPI ? 'PASS' : 'FAIL',
      message: hasPermissionsAPI ? 'Permissions API available' : 'Permissions API not available',
    });

    // 8. Check camera permission
    if (hasPermissionsAPI && navigator.permissions.query) {
      try {
        const cameraPermission = await navigator.permissions.query({
          name: 'camera',
        });
        results.push({
          test: 'Camera Permission Status',
          status: cameraPermission.state === 'granted' ? 'GRANTED' : cameraPermission.state.toUpperCase(),
          message: `Current camera permission state: ${cameraPermission.state}`,
        });
      } catch (err) {
        results.push({
          test: 'Camera Permission Status',
          status: 'UNKNOWN',
          message: `Cannot determine permission: ${err.message}`,
        });
      }
    }

    setTestResults(results);
  };

  const runQuickChecks = async () => {
    const logs = [];
    const push = (msg) => { logs.push(msg); setQuickLog([...logs]); };

    push('Running quick checks...');
    push(`navigator: ${!!navigator}`);
    push(`mediaDevices: ${!!navigator.mediaDevices}`);
    push(`getUserMedia available: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}`);

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        push(`enumerateDevices returned ${devices.length} devices, cameras: ${videoDevices.length}`);
        videoDevices.forEach((d, i) => push(`  camera[${i}]: ${d.label || '(no label)'} id:${d.deviceId}`));
      } catch (err) {
        push(`enumerateDevices error: ${err.message}`);
      }
    } else {
      push('enumerateDevices not available');
    }

    // Attempt a quick getUserMedia test (will request permission if not granted)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        push('Requesting getUserMedia...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        push(`getUserMedia: OK - tracks: ${stream.getTracks().length}`);
        stream.getTracks().forEach((t) => push(`  track: ${t.kind} - ${t.label || '(no label)'} - enabled:${t.enabled}`));
        // stop tracks
        stream.getTracks().forEach((t) => t.stop());
        push('Stream stopped');
      } catch (err) {
        push(`getUserMedia error: ${err.name} - ${err.message}`);
      }
    } else {
      push('getUserMedia not available');
    }
  };

  const testCameraAccess = async () => {
    setIsTestingCamera(true);
    try {
      console.log('Starting camera test...');

      // Try to get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      console.log('✓ Camera stream obtained successfully');
      console.log('Stream tracks:', stream.getTracks());

      // Try to load stream into video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to load
        await new Promise((resolve) => {
          const handleLoadedMetadata = () => {
            console.log('✓ Video metadata loaded');
            console.log('Video dimensions:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            resolve();
          };
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          setTimeout(resolve, 5000); // Timeout after 5 seconds
        });
      }

      // Ensure playback starts (some browsers require an explicit play call)
      if (videoRef.current) {
        try {
          const playPromise = videoRef.current.play();
          if (playPromise && typeof playPromise.then === 'function') {
            await playPromise.catch((pErr) => console.warn('Diagnostics video play() rejected:', pErr));
          }
        } catch (err) {
          console.warn('Diagnostics explicit play() failed:', err);
        }
      }

      setDiagnostics((prev) => ({
        ...prev,
        cameraAvailable: true,
        cameraPermission: 'GRANTED',
        currentError: null,
      }));

      console.log('✓ Camera test PASSED');
    } catch (err) {
      console.error('✗ Camera test FAILED:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);

      let errorExplanation = err.message;
      if (err.name === 'NotAllowedError') {
        errorExplanation = 'User denied camera permission. Please check your browser settings and allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorExplanation = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorExplanation = 'Camera is already in use by another application. Close other apps using the camera.';
      } else if (err.name === 'SecurityError') {
        errorExplanation = 'Camera access requires HTTPS or localhost.';
      } else if (err.name === 'TypeError') {
        errorExplanation = 'getUserMedia API not available or incorrect parameters.';
      }

      setDiagnostics((prev) => ({
        ...prev,
        cameraAvailable: false,
        cameraPermission: err.name === 'NotAllowedError' ? 'DENIED' : 'UNKNOWN',
        currentError: `${err.name}: ${errorExplanation}`,
      }));
    } finally {
      setIsTestingCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setDiagnostics((prev) => ({
      ...prev,
      cameraAvailable: null,
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS':
        return '#28a745';
      case 'FAIL':
        return '#dc3545';
      case 'GRANTED':
        return '#28a745';
      case 'DENIED':
        return '#dc3545';
      case 'UNKNOWN':
        return '#ffc107';
      default:
        return '#999';
    }
  };

  return (
    <div className="diagnostics-container">
      <div className="diagnostics-header">
        <h1>🔍 Camera Diagnostics</h1>
        <p>This tool helps identify camera issues. Check all results below.</p>
      </div>

      <div className="diagnostics-section">
        <h2>📋 System Check Results</h2>
        <div className="test-results">
          {testResults.map((result, idx) => (
            <div key={idx} className="test-item">
              <div className="test-header">
                <span
                  className="test-status"
                  style={{ backgroundColor: getStatusColor(result.status) }}
                >
                  {result.status}
                </span>
                <span className="test-name">{result.test}</span>
              </div>
              <div className="test-message">{result.message}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="diagnostics-section">
        <h2>🎥 Live Camera Input (Take & Capture)</h2>
        <p>Test the camera capture feature below:</p>
        <CameraInput 
          onImagesSelected={(images) => {
            console.log('📸 Captured images:', images);
            alert(`✅ Captured ${images.length} image(s)!`);
          }}
          maxImages={5}
          required={false}
          cameraOnly={true}
        />
      </div>

      <div className="diagnostics-section">
        <h2>🎥 Camera Diagnostics Test</h2>
        {diagnostics.currentError && (
          <div className="error-alert">
            <strong>⚠️ Error:</strong> {diagnostics.currentError}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-primary" onClick={runQuickChecks} style={{ marginRight: 8 }}>Run Quick Checks</button>
          <button type="button" className="btn btn-primary" onClick={testCameraAccess} disabled={isTestingCamera}>
            {isTestingCamera ? 'Testing Camera...' : 'Test Camera Access'}
          </button>
        </div>

        {quickLog.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h3>Quick Check Output</h3>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
              {quickLog.join('\n')}
            </pre>
          </div>
        )}
        {diagnostics.cameraAvailable === true ? (
          <div>
            <div className="success-alert">
              ✓ Camera is working! You can see the live preview below.
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-preview"
              style={{ 
                width: '100%', 
                height: 'auto',
                maxWidth: '100%', 
                marginTop: '1rem', 
                borderRadius: '8px',
                backgroundColor: '#000',
                display: 'block',
                objectFit: 'cover',
                aspectRatio: '4 / 3'
              }}
            />
            <button
              type="button"
              className="btn btn-danger"
              onClick={stopCamera}
              style={{ marginTop: '1rem' }}
            >
              Stop Camera
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={testCameraAccess}
            disabled={isTestingCamera}
            style={{ marginTop: '1rem' }}
          >
            {isTestingCamera ? 'Testing Camera...' : 'Test Camera Access'}
          </button>
        )}
      </div>

      <div className="diagnostics-section">
        <h2>💡 Troubleshooting Guide</h2>
        <div className="troubleshooting">
          <div className="troubleshooting-item">
            <h3>❌ "Camera permission denied"</h3>
            <p>
              <strong>Solution:</strong> Your browser is blocking camera access.
              <br />
              1. Look for the camera icon in your address bar
              <br />
              2. Click on it and select "Allow" for camera access
              <br />
              3. Refresh the page and try again
              <br />
              If you don't see the prompt, check your browser settings:
              <br />
              - Chrome/Edge: Settings → Privacy → Site Settings → Camera
              <br />
              - Firefox: Preferences → Privacy → Permissions → Camera
            </p>
          </div>

          <div className="troubleshooting-item">
            <h3>❌ "No camera found"</h3>
            <p>
              <strong>Solution:</strong> Your device doesn't have a camera detected.
              <br />
              1. Check if your device has a built-in camera
              <br />
              2. If using external camera, ensure it's connected and powered on
              <br />
              3. Check Device Manager to see if camera driver is installed
              <br />
              4. Restart your device
            </p>
          </div>

          <div className="troubleshooting-item">
            <h3>❌ "Camera is in use by another application"</h3>
            <p>
              <strong>Solution:</strong> Another app is using your camera.
              <br />
              1. Close all other applications using the camera (Zoom, Teams, etc.)
              <br />
              2. Close and reopen your browser
              <br />
              3. Try again
            </p>
          </div>

          <div className="troubleshooting-item">
            <h3>❌ "Camera access requires HTTPS"</h3>
            <p>
              <strong>Solution:</strong> You're not on a secure connection.
              <br />
              1. Make sure you're accessing localhost (http://localhost:5174)
              <br />
              2. If you're accessing from another computer, use HTTPS
              <br />
              3. Check that the development server is running
            </p>
          </div>

          <div className="troubleshooting-item">
            <h3>❌ "Browser not supported"</h3>
            <p>
              <strong>Solution:</strong> Your browser is too old.
              <br />
              Supported browsers:
              <br />
              - Chrome 53+
              <br />
              - Firefox 55+
              <br />
              - Safari 14.5+
              <br />
              - Edge 79+
              <br />
              Please update your browser.
            </p>
          </div>
        </div>
      </div>

      <div className="diagnostics-section">
        <h2>🛠️ Browser Console Logs</h2>
        <p>
          Open your browser's developer console (F12 or right-click → Inspect) and
          check the Console tab for any error messages. These messages will help
          identify the exact issue.
        </p>
        <code style={{ display: 'block', padding: '1rem', background: '#f5f5f5', marginTop: '1rem' }}>
          Press F12 → Console tab → Look for red error messages
        </code>
      </div>
    </div>
  );
};

export default CameraDiagnostics;
