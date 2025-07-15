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

// Check if we're in a web environment
const isWebEnvironment = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

// Helper to generate a random base58 string of length 32-44
function randomBase58Address() {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const length = Math.floor(Math.random() * (44 - 32 + 1)) + 32;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}

// Mock wallet connection for development
const mockWalletConnection = async () => {
  console.log("Running in development environment - using fallback wallet connection");
  
  // Simulate wallet connection delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a mock auth token
  const mockAuthToken = `mock_auth_${Date.now()}`;
  
  // Generate a random valid wallet address
  const randomWalletAddress = randomBase58Address();
  
  // Store the mock data
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockAuthToken);
  await AsyncStorage.setItem(WALLET_ADDRESS_KEY, randomWalletAddress);
  
  const result = {
    success: true,
    walletAddress: randomWalletAddress,
    authToken: mockAuthToken,
  };
  
  console.log('Mock wallet connection result:', result);
  return result;
};

export const connectWallet = async () => {
  try {
    // If in Expo Go or web environment, use fallback implementation
    if (isExpoGo() || isWebEnvironment()) {
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
        error.message.includes('transact is not a function') ||
        error.message.includes('mobile wallet protocol')) {
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
    
    if (storedAuthToken && !isExpoGo() && !isWebEnvironment()) {
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