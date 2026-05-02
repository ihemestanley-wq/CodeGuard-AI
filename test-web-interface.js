/**
 * Comprehensive Test Script for CodeGuard AI Web Interface
 * Tests all API endpoints, error handling, and integration
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SAMPLE_DIFF_PATH = path.join(__dirname, 'examples', 'sample.diff');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.yellow}${message}${colors.reset}`);
  }
  testResults.details.push({ name, passed, message });
}

/**
 * Test 1: Server Health Check
 */
async function testHealthCheck() {
  console.log(`\n${colors.cyan}=== Test 1: Server Health Check ===${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    logTest('Health endpoint responds', response.status === 200);
    logTest('Health response has status field', data.status !== undefined);
    logTest('Health status is "healthy"', data.status === 'healthy');
    logTest('Health response has timestamp', data.timestamp !== undefined);
    logTest('Health response has uptime', data.uptime !== undefined);
    
    console.log(`  Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    logTest('Health endpoint responds', false, error.message);
  }
}

/**
 * Test 2: Analyze Endpoint with Valid Diff
 */
async function testAnalyzeWithValidDiff() {
  console.log(`\n${colors.cyan}=== Test 2: Analyze Endpoint with Valid Diff ===${colors.reset}`);
  
  try {
    // Read sample diff
    const diffContent = fs.readFileSync(SAMPLE_DIFF_PATH, 'utf8');
    console.log(`  Loaded sample diff (${diffContent.length} bytes)`);
    
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ diffContent: diffContent })
    });
    
    const data = await response.json();
    
    logTest('Analyze endpoint responds', response.status === 200);
    logTest('Response has success field', data.success !== undefined);
    logTest('Response has data field', data.data !== undefined);
    
    if (data.data) {
      logTest('Data has report', data.data.report !== undefined);
      logTest('Data has metadata', data.data.metadata !== undefined);
      logTest('Report is a string', typeof data.data.report === 'string');
      logTest('Report is not empty', data.data.report.length > 0);
      
      if (data.data.metadata) {
        console.log(`  Processing Time: ${data.data.metadata.processingTime}ms`);
        console.log(`  Diff Size: ${data.data.metadata.diffSize} bytes`);
      }
      
      // Show a snippet of the report
      const reportSnippet = data.data.report.substring(0, 200);
      console.log(`  Report snippet: ${reportSnippet}...`);
    }
    
  } catch (error) {
    logTest('Analyze endpoint with valid diff', false, error.message);
  }
}

/**
 * Test 3: Error Handling - Empty Diff
 */
async function testEmptyDiff() {
  console.log(`\n${colors.cyan}=== Test 3: Error Handling - Empty Diff ===${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ diffContent: '' })
    });
    
    const data = await response.json();
    
    logTest('Empty diff returns error', response.status === 400);
    logTest('Error response has error field', data.error !== undefined);
    console.log(`  Error message: ${data.error}`);
    
  } catch (error) {
    logTest('Empty diff error handling', false, error.message);
  }
}

/**
 * Test 4: Error Handling - Missing Diff Field
 */
async function testMissingDiffField() {
  console.log(`\n${colors.cyan}=== Test 4: Error Handling - Missing Diff Field ===${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    logTest('Missing diff field returns error', response.status === 400);
    logTest('Error response has error field', data.error !== undefined);
    console.log(`  Error message: ${data.error}`);
    
  } catch (error) {
    logTest('Missing diff field error handling', false, error.message);
  }
}

/**
 * Test 5: Error Handling - Invalid JSON
 */
async function testInvalidJSON() {
  console.log(`\n${colors.cyan}=== Test 5: Error Handling - Invalid JSON ===${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    });
    
    const data = await response.json();
    
    logTest('Invalid JSON returns error', response.status === 400);
    logTest('Error response has error field', data.error !== undefined);
    console.log(`  Error message: ${data.error}`);
    
  } catch (error) {
    logTest('Invalid JSON error handling', false, error.message);
  }
}

/**
 * Test 6: Error Handling - Too Large Diff
 */
async function testTooLargeDiff() {
  console.log(`\n${colors.cyan}=== Test 6: Error Handling - Too Large Diff ===${colors.reset}`);
  
  try {
    // Create a diff larger than 1MB
    const largeDiff = 'a'.repeat(2 * 1024 * 1024); // 2MB
    
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ diffContent: largeDiff })
    });
    
    const data = await response.json();
    
    // Large diff might succeed or fail depending on implementation
    // If it succeeds, it should return 200 with a report
    // If it fails, it should return 400 or 413
    const isSuccess = response.status === 200 && data.success === true;
    const isError = (response.status === 413 || response.status === 400) && data.error !== undefined;
    
    logTest('Too large diff handled correctly', isSuccess || isError);
    
    if (isSuccess) {
      console.log(`  Large diff processed successfully`);
    } else if (isError) {
      console.log(`  Error message: ${data.error}`);
    }
    
  } catch (error) {
    logTest('Too large diff error handling', false, error.message);
  }
}

/**
 * Test 7: Rate Limiting
 */
async function testRateLimiting() {
  console.log(`\n${colors.cyan}=== Test 7: Rate Limiting ===${colors.reset}`);
  
  try {
    const requests = [];
    const numRequests = 105; // Exceed the 100 requests per 15 minutes limit
    
    console.log(`  Sending ${numRequests} rapid requests to test rate limiting...`);
    console.log(`  (Rate limit: 100 requests per 15 minutes)`);
    
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/health`)
          .then(r => ({ status: r.status, index: i }))
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    logTest('Rate limiting is active', rateLimited);
    
    const successCount = responses.filter(r => r.status === 200).length;
    const limitedCount = responses.filter(r => r.status === 429).length;
    
    console.log(`  Successful requests: ${successCount}`);
    console.log(`  Rate limited requests: ${limitedCount}`);
    
  } catch (error) {
    logTest('Rate limiting test', false, error.message);
  }
}

/**
 * Test 8: Frontend Static Files
 */
async function testFrontendFiles() {
  console.log(`\n${colors.cyan}=== Test 8: Frontend Static Files ===${colors.reset}`);
  
  try {
    // Wait a bit to avoid rate limiting from previous tests
    console.log(`  Waiting 2 seconds to avoid rate limiting...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test main HTML page
    const htmlResponse = await fetch(`${BASE_URL}/`);
    logTest('Main HTML page loads', htmlResponse.status === 200);
    logTest('HTML content type is correct', htmlResponse.headers.get('content-type')?.includes('text/html'));
    
    // Test CSS file
    const cssResponse = await fetch(`${BASE_URL}/css/styles.css`);
    logTest('CSS file loads', cssResponse.status === 200);
    logTest('CSS content type is correct', cssResponse.headers.get('content-type')?.includes('text/css'));
    
    // Test JS file
    const jsResponse = await fetch(`${BASE_URL}/js/app.js`);
    logTest('JS file loads', jsResponse.status === 200);
    logTest('JS content type is correct', jsResponse.headers.get('content-type')?.includes('javascript'));
    
  } catch (error) {
    logTest('Frontend static files test', false, error.message);
  }
}

/**
 * Test 9: Security Headers
 */
async function testSecurityHeaders() {
  console.log(`\n${colors.cyan}=== Test 9: Security Headers ===${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const headers = response.headers;
    
    logTest('X-Content-Type-Options header present', headers.has('x-content-type-options'));
    logTest('X-Frame-Options header present', headers.has('x-frame-options'));
    logTest('X-XSS-Protection header present', headers.has('x-xss-protection'));
    logTest('Strict-Transport-Security header present', headers.has('strict-transport-security'));
    
    console.log(`  Security headers:`);
    console.log(`    X-Content-Type-Options: ${headers.get('x-content-type-options')}`);
    console.log(`    X-Frame-Options: ${headers.get('x-frame-options')}`);
    console.log(`    X-XSS-Protection: ${headers.get('x-xss-protection')}`);
    
  } catch (error) {
    logTest('Security headers test', false, error.message);
  }
}

/**
 * Test 10: CORS Configuration
 */
async function testCORS() {
  console.log(`\n${colors.cyan}=== Test 10: CORS Configuration ===${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'http://example.com'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    logTest('CORS header present', corsHeader !== null);
    console.log(`  Access-Control-Allow-Origin: ${corsHeader}`);
    
  } catch (error) {
    logTest('CORS configuration test', false, error.message);
  }
}

/**
 * Print final test summary
 */
function printSummary() {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  console.log(`\nTotal Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.message) console.log(`    ${t.message}`);
      });
  }
  
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}✓ All tests passed! Web interface is production-ready.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed. Please review the issues above.${colors.reset}`);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}CodeGuard AI Web Interface - Comprehensive Test Suite${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`\nTesting server at: ${BASE_URL}`);
  console.log(`Start time: ${new Date().toISOString()}\n`);
  
  try {
    await testHealthCheck();
    await testAnalyzeWithValidDiff();
    await testEmptyDiff();
    await testMissingDiffField();
    await testInvalidJSON();
    await testTooLargeDiff();
    await testRateLimiting();
    await testFrontendFiles();
    await testSecurityHeaders();
    await testCORS();
    
    printSummary();
    
    // Save results to file
    const reportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        passRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
      },
      details: testResults.details
    }, null, 2));
    
    console.log(`\n${colors.cyan}Test results saved to: ${reportPath}${colors.reset}`);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

// Made with Bob
