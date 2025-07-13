const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// Test data
const testUser = {
  username: 'test_user',
  solanaAddress: 'test_solana_address_123',
  mobileAuthToken: 'test_mobile_token'
};

const testMatch = {
  user1Id: 'user-1',
  user2Id: 'user-2',
  compatibilityScore: 85,
  matchReasons: ['Both Mad Lads holders', 'Similar DeFi activity'],
  status: 'ACCEPTED'
};

// Helper function to log test results
const logTest = (testName, success, data = null, error = null) => {
  console.log(`\n🧪 ${testName}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  if (data) console.log('📊 Response:', JSON.stringify(data, null, 2));
  if (error) console.log('❌ Error:', error.response?.data || error.message);
};

// Test 1: Authentication
async function testAuth() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    authToken = response.data.token;
    logTest('Authentication', true, { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    logTest('Authentication', false, null, error);
    return false;
  }
}

// Test 2: Date Suggestion
async function testDateSuggestion() {
  try {
    const dateData = {
      matchId: 'test-match-id',
      locationType: 'NFT_GALLERY',
      customDetails: 'Meet at Degenerate Ape Gallery',
      proposedTime: '2025-07-20T19:30:00Z',
      location: '123 Main St, San Francisco, CA'
    };

    const response = await axios.post(`${BASE_URL}/dates/suggest`, dateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Date Suggestion', true, response.data);
    return response.data.dateId;
  } catch (error) {
    logTest('Date Suggestion', false, null, error);
    return null;
  }
}

// Test 3: Date Confirmation
async function testDateConfirmation(dateId) {
  try {
    const confirmData = {
      confirmedTime: '2025-07-20T19:30:00Z',
      confirmedLocation: '123 Main St, San Francisco, CA',
      additionalDetails: 'Meet at the entrance at 7:30 PM'
    };

    const response = await axios.post(`${BASE_URL}/dates/${dateId}/confirm`, confirmData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Date Confirmation', true, response.data);
    return true;
  } catch (error) {
    logTest('Date Confirmation', false, null, error);
    return false;
  }
}

// Test 4: Date Verification
async function testDateVerification(dateId) {
  try {
    const verifyData = {
      coordinates: [37.7749, -122.4194],
      timestamp: '2025-07-20T19:30:00Z'
    };

    const response = await axios.post(`${BASE_URL}/dates/${dateId}/verify`, verifyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Date Verification', true, response.data);
    return true;
  } catch (error) {
    logTest('Date Verification', false, null, error);
    return false;
  }
}

// Test 5: Get Date Details
async function testGetDateDetails(dateId) {
  try {
    const response = await axios.get(`${BASE_URL}/dates/${dateId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Date Details', true, response.data);
    return true;
  } catch (error) {
    logTest('Get Date Details', false, null, error);
    return false;
  }
}

// Test 6: Get Match Dates
async function testGetMatchDates() {
  try {
    const response = await axios.get(`${BASE_URL}/dates/match/test-match-id`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Match Dates', true, response.data);
    return true;
  } catch (error) {
    logTest('Get Match Dates', false, null, error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Date Planning API Tests...\n');

  // Test authentication first
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Stopping tests.');
    return;
  }

  // Test date suggestion
  const dateId = await testDateSuggestion();
  if (!dateId) {
    console.log('\n❌ Date suggestion failed. Stopping tests.');
    return;
  }

  // Test date confirmation
  const confirmSuccess = await testDateConfirmation(dateId);
  if (!confirmSuccess) {
    console.log('\n❌ Date confirmation failed. Stopping tests.');
    return;
  }

  // Test date verification
  const verifySuccess = await testDateVerification(dateId);
  if (!verifySuccess) {
    console.log('\n❌ Date verification failed. Stopping tests.');
    return;
  }

  // Test get date details
  await testGetDateDetails(dateId);

  // Test get match dates
  await testGetMatchDates();

  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAuth,
  testDateSuggestion,
  testDateConfirmation,
  testDateVerification,
  testGetDateDetails,
  testGetMatchDates,
  runTests
}; 