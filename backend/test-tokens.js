const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testUserId = '';

// Test data
const testUser = {
  username: 'token_test_user',
  solanaAddress: 'test_solana_address_456',
  mobileAuthToken: 'test_mobile_token_456'
};

const testRecipient = {
  username: 'token_recipient',
  solanaAddress: 'test_solana_address_789',
  mobileAuthToken: 'test_mobile_token_789'
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
    testUserId = response.data.user.id;
    logTest('Authentication', true, { 
      token: authToken.substring(0, 20) + '...',
      userId: testUserId 
    });
    return true;
  } catch (error) {
    logTest('Authentication', false, null, error);
    return false;
  }
}

// Test 2: Get Token Prices
async function testGetTokenPrices() {
  try {
    const response = await axios.get(`${BASE_URL}/tokens/prices`);
    logTest('Get Token Prices', true, response.data);
    return true;
  } catch (error) {
    logTest('Get Token Prices', false, null, error);
    return false;
  }
}

// Test 3: Get Token Balance
async function testGetTokenBalance() {
  try {
    const response = await axios.get(`${BASE_URL}/tokens/balance`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Get Token Balance', true, response.data);
    return response.data.balance;
  } catch (error) {
    logTest('Get Token Balance', false, null, error);
    return 0;
  }
}

// Test 4: Purchase Tokens
async function testPurchaseTokens() {
  try {
    const purchaseData = {
      amount: 5,
      currency: 'USDC',
      wallet: '7sP123456789012345678901234567890123456789'
    };

    const response = await axios.post(`${BASE_URL}/tokens/purchase`, purchaseData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Purchase Tokens', true, response.data);
    return response.data.txSignature;
  } catch (error) {
    logTest('Purchase Tokens', false, null, error);
    return null;
  }
}

// Test 5: Spend Tokens
async function testSpendTokens() {
  try {
    const spendData = {
      amount: 1,
      purpose: 'Date suggestion',
      referenceId: 'date-test-123'
    };

    const response = await axios.post(`${BASE_URL}/tokens/spend`, spendData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Spend Tokens', true, response.data);
    return true;
  } catch (error) {
    logTest('Spend Tokens', false, null, error);
    return false;
  }
}

// Test 6: Get Token History
async function testGetTokenHistory() {
  try {
    const response = await axios.get(`${BASE_URL}/tokens/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Token History', true, response.data);
    return true;
  } catch (error) {
    logTest('Get Token History', false, null, error);
    return false;
  }
}

// Test 7: Get Vouchers
async function testGetVouchers() {
  try {
    const response = await axios.get(`${BASE_URL}/tokens/vouchers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Vouchers', true, response.data);
    return true;
  } catch (error) {
    logTest('Get Vouchers', false, null, error);
    return false;
  }
}

// Test 8: Transfer Tokens
async function testTransferTokens() {
  try {
    // First, create a recipient user
    const recipientResponse = await axios.post(`${BASE_URL}/auth/signup`, testRecipient);
    const recipientId = recipientResponse.data.user.id;

    const transferData = {
      recipientId: recipientId,
      amount: 2,
      message: 'Thanks for the great date!'
    };

    const response = await axios.post(`${BASE_URL}/tokens/transfer`, transferData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Transfer Tokens', true, response.data);
    return true;
  } catch (error) {
    logTest('Transfer Tokens', false, null, error);
    return false;
  }
}

// Test 9: Invalid Purchase (Validation Test)
async function testInvalidPurchase() {
  try {
    const invalidData = {
      amount: 150, // Too high
      currency: 'INVALID',
      wallet: 'invalid-wallet'
    };

    const response = await axios.post(`${BASE_URL}/tokens/purchase`, invalidData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // This should fail, so if we get here, it's an error
    logTest('Invalid Purchase (Validation)', false, response.data);
    return false;
  } catch (error) {
    // Expected to fail
    logTest('Invalid Purchase (Validation)', true, null, error);
    return true;
  }
}

// Test 10: Insufficient Balance Test
async function testInsufficientBalance() {
  try {
    const spendData = {
      amount: 1000, // More than user has
      purpose: 'Test insufficient balance',
      referenceId: 'test-insufficient'
    };

    const response = await axios.post(`${BASE_URL}/tokens/spend`, spendData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // This should fail, so if we get here, it's an error
    logTest('Insufficient Balance Test', false, response.data);
    return false;
  } catch (error) {
    // Expected to fail
    logTest('Insufficient Balance Test', true, null, error);
    return true;
  }
}

// Test 11: Self Transfer Test
async function testSelfTransfer() {
  try {
    const transferData = {
      recipientId: testUserId, // Transfer to self
      amount: 1,
      message: 'Self transfer test'
    };

    const response = await axios.post(`${BASE_URL}/tokens/transfer`, transferData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // This should fail, so if we get here, it's an error
    logTest('Self Transfer Test', false, response.data);
    return false;
  } catch (error) {
    // Expected to fail
    logTest('Self Transfer Test', true, null, error);
    return true;
  }
}

// Test 12: Unauthorized Access Test
async function testUnauthorizedAccess() {
  try {
    const response = await axios.get(`${BASE_URL}/tokens/balance`);
    // This should fail without auth token
    logTest('Unauthorized Access Test', false, response.data);
    return false;
  } catch (error) {
    // Expected to fail
    logTest('Unauthorized Access Test', true, null, error);
    return true;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Token Economy API Tests...\n');

  // Test authentication first
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Stopping tests.');
    return;
  }

  // Test public endpoints
  await testGetTokenPrices();

  // Test authenticated endpoints
  await testGetTokenBalance();
  
  const purchaseSuccess = await testPurchaseTokens();
  if (!purchaseSuccess) {
    console.log('\n⚠️ Token purchase failed, but continuing with other tests...');
  }

  await testSpendTokens();
  await testGetTokenHistory();
  await testGetVouchers();
  await testTransferTokens();

  // Test error cases
  await testInvalidPurchase();
  await testInsufficientBalance();
  await testSelfTransfer();
  await testUnauthorizedAccess();

  console.log('\n🎉 All token economy tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAuth,
  testGetTokenPrices,
  testGetTokenBalance,
  testPurchaseTokens,
  testSpendTokens,
  testGetTokenHistory,
  testGetVouchers,
  testTransferTokens,
  testInvalidPurchase,
  testInsufficientBalance,
  testSelfTransfer,
  testUnauthorizedAccess,
  runTests
}; 