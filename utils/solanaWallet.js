import AsyncStorage from "@react-native-async-storage/async-storage";

// App identity for the wallet adapter
export const APP_IDENTITY = {
  name: "DineTime",
  uri: "https://dinetime.com",
  icon: "favicon.ico",
};

// Store auth token for future sessions
const AUTH_TOKEN_KEY = "solana_auth_token";
const WALLET_ADDRESS_KEY = "solana_wallet_address";

// Fallback wallet address for development
const FALLBACK_WALLET_ADDRESS = "7xKXtg2CW87d97ZJZR6Qh4xexk7tXtJhtfcoQ3fhszti";

// Check if we're in Expo Go (development mode)
const isExpoGo = () => {
  return typeof global.Expo !== 'undefined' && global.Expo.Constants.appOwnership === 'expo';
};

// Mock wallet connection for development
const mockWalletConnection = async () => {
  console.log("Running in Expo Go - using fallback wallet connection");
  
  // Simulate wallet connection delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a mock auth token
  const mockAuthToken = `mock_auth_${Date.now()}`;
  
  // Store the mock data
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockAuthToken);
  await AsyncStorage.setItem(WALLET_ADDRESS_KEY, FALLBACK_WALLET_ADDRESS);
  
  return {
    success: true,
    walletAddress: FALLBACK_WALLET_ADDRESS,
    authToken: mockAuthToken,
  };
};

export const connectWallet = async () => {
  try {
    // If in Expo Go, use fallback implementation
    if (isExpoGo()) {
      return await mockWalletConnection();
    }

    // Try to import the actual MWA libraries
    let transact;
    try {
      const mwaModule = await import("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
      transact = mwaModule.transact;
    } catch (importError) {
      console.log("MWA import failed, using fallback:", importError.message);
      return await mockWalletConnection();
    }
    
    if (!transact) {
      console.log("transact function not available, using fallback");
      return await mockWalletConnection();
    }
    
    // Try to get stored auth token
    const storedAuthToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    const authorizationResult = await transact(async (wallet) => {
      const authResult = await wallet.authorize({
        cluster: "solana:devnet",
        identity: APP_IDENTITY,
        auth_token: storedAuthToken || undefined,
      });

      return authResult;
    });

    // Store the auth token and wallet address for future use
    if (authorizationResult.auth_token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authorizationResult.auth_token);
    }
    
    if (authorizationResult.accounts && authorizationResult.accounts.length > 0) {
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, authorizationResult.accounts[0].address);
    }

    return {
      success: true,
      walletAddress: authorizationResult.accounts[0]?.address,
      authToken: authorizationResult.auth_token,
    };
  } catch (error) {
    console.error("Wallet connection error:", error);
    
    // If MWA fails, fall back to mock implementation
    if (error.message.includes('SolanaMobileWalletAdapter') || 
        error.message.includes('TurboModuleRegistry') ||
        error.message.includes('transact is not a function')) {
      console.log("MWA not available, using fallback implementation");
      return await mockWalletConnection();
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
};

export const disconnectWallet = async () => {
  try {
    const storedAuthToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    if (storedAuthToken && !isExpoGo()) {
      try {
        const mwaModule = await import("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
        const { transact } = mwaModule;
        
        if (transact) {
          await transact(async (wallet) => {
            await wallet.deauthorize({ auth_token: storedAuthToken });
          });
        }
      } catch (error) {
        console.log("MWA deauthorize failed, continuing with local cleanup");
      }
    }

    // Clear stored data
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
    await AsyncStorage.setItem("isGuest", "false");
    await AsyncStorage.setItem("userEmail", "");

    return { success: true };
  } catch (error) {
    console.error("Wallet disconnection error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getStoredWalletAddress = async () => {
  return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
};

export const isWalletConnected = async () => {
  const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const walletAddress = await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
  return !!(authToken && walletAddress);
}; 