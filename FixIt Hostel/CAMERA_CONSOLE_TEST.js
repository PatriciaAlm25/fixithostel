// Add this to browser console to test camera capture
// Open F12 → Console → Paste this code

console.log('%c🎥 CAMERA TEST STARTED', 'color: blue; font-size: 16px; font-weight: bold;');

// Test 1: Check navigator
console.log('✓ Navigator available:', !!navigator);
console.log('✓ mediaDevices available:', !!navigator.mediaDevices);
console.log('✓ getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);

// Test 2: List devices
if (navigator.mediaDevices?.enumerateDevices) {
  navigator.mediaDevices.enumerateDevices().then(devices => {
    console.log('%c📊 Devices:', 'color: green; font-weight: bold;');
    devices.forEach(device => {
      console.log(`  ${device.kind}: ${device.label || 'Unknown'}`);
    });
  });
}

// Test 3: Request camera access
console.log('%c🎬 Requesting camera access...', 'color: orange; font-weight: bold;');
navigator.mediaDevices.getUserMedia({ 
  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false
}).then(stream => {
  console.log('%c✓ Camera stream received!', 'color: green; font-size: 14px; font-weight: bold;');
  console.log('  Stream tracks:', stream.getTracks().length);
  stream.getTracks().forEach(track => {
    console.log(`  - ${track.kind}: ${track.label || 'Unknown'}, enabled: ${track.enabled}`);
  });
  
  // Stop all tracks
  stream.getTracks().forEach(track => track.stop());
  console.log('✓ Stream stopped');
}).catch(err => {
  console.error('%c❌ Camera error:', 'color: red; font-weight: bold;', err.name, err.message);
});
