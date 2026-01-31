/**
 * Test helper to verify image saving and loading flow
 * Run this in browser console to test
 */

export const testImageFlow = async () => {
  console.log('🧪 Starting image flow test...');
  
  try {
    // Step 1: Check if Supabase client is available
    const { supabase } = await import('./supabaseClient.js');
    console.log('✅ Supabase client loaded');
    
    // Step 2: Test parseIssueImages function
    const { parseIssueImages } = await import('./supabaseIssues.js');
    
    const testData = [
      { input: null, expected: [] },
      { input: [], expected: [] },
      { input: ['url1', 'url2'], expected: ['url1', 'url2'] },
      { input: '["url1", "url2"]', expected: ['url1', 'url2'] },
    ];
    
    console.log('🧪 Testing parseIssueImages...');
    testData.forEach(test => {
      const result = parseIssueImages(test.input);
      const pass = JSON.stringify(result) === JSON.stringify(test.expected);
      console.log(`  ${pass ? '✅' : '❌'} Input: ${JSON.stringify(test.input)} → ${JSON.stringify(result)}`);
    });
    
    // Step 3: Fetch a recent issue and check its images
    console.log('🧪 Fetching recent issues...');
    const { data, error } = await supabase
      .from('issues')
      .select('id, description, images, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching issues:', error);
    } else {
      console.log('✅ Recent issues:', data);
      data.forEach(issue => {
        console.log(`  Issue: ${issue.description}`);
        console.log(`    images type: ${typeof issue.images}`);
        console.log(`    images raw: ${issue.images}`);
      });
    }
    
    console.log('🧪 Test complete!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Make it available in console
window.testImageFlow = testImageFlow;
console.log('💡 Run testImageFlow() in console to test image flow');
