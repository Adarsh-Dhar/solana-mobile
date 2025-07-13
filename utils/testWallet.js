import { connectWallet, disconnectWallet, isWalletConnected } from './solanaWallet';

// Test the wallet connection
export const testWalletConnection = async () => {
  console.log('Testing wallet connection...');
  
  try {
    // Test connection
    const result = await connectWallet();
    console.log('Connection result:', result);
    
    // Test connection status
    const isConnected = await isWalletConnected();
    console.log('Is connected:', isConnected);
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test wallet disconnection
export const testWalletDisconnection = async () => {
  console.log('Testing wallet disconnection...');
  
  try {
    const result = await disconnectWallet();
    console.log('Disconnection result:', result);
    
    // Test connection status after disconnection
    const isConnected = await isWalletConnected();
    console.log('Is connected after disconnection:', isConnected);
    
    return result;
  } catch (error) {
    console.error('Disconnection test failed:', error);
    return { success: false, error: error.message };
  }
}; 