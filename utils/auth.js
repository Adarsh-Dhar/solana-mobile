import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectWallet, disconnectWallet, isWalletConnected } from './solanaWallet';

export const authService = {
  async registerWithWallet(username, gender, dateOfBirth) {
    try {
      // Connect wallet first
      const walletResult = await connectWallet();
      
      if (!walletResult.success) {
        throw new Error(walletResult.error || 'Failed to connect wallet');
      }

      console.log('Wallet connection result:', walletResult);

      // Register with backend
      const registrationData = {
        solanaAddress: walletResult.walletAddress,
        mobileAuthToken: walletResult.authToken,
        username,
        gender,
        dateOfBirth
      };

      console.log('Sending registration data:', registrationData);

      const response = await api.post('/auth/register', registrationData);

      // Store wallet info
      await AsyncStorage.setItem('solanaAddress', walletResult.walletAddress);
      await AsyncStorage.setItem('authToken', walletResult.authToken);
      await AsyncStorage.setItem('username', username);

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async loginWithWallet() {
    try {
      // Connect wallet
      const walletResult = await connectWallet();
      
      if (!walletResult.success) {
        throw new Error(walletResult.error || 'Failed to connect wallet');
      }

      // Try to login first
      try {
        const response = await api.post('/auth/login', {
          solanaAddress: walletResult.walletAddress,
          mobileAuthToken: walletResult.authToken
        });

        // Store wallet info
        await AsyncStorage.setItem('solanaAddress', walletResult.walletAddress);
        await AsyncStorage.setItem('authToken', walletResult.authToken);

        return response.data;
      } catch (loginError) {
        // If login fails (user doesn't exist), try to register automatically
        if (loginError.response?.status === 401) {
          console.log('User not found, attempting auto-registration...');
          
          // Generate a default username from wallet address
          const defaultUsername = `user_${walletResult.walletAddress.slice(0, 8)}`;
          
          const registerResponse = await api.post('/auth/register', {
            solanaAddress: walletResult.walletAddress,
            mobileAuthToken: walletResult.authToken,
            username: defaultUsername
          });

          // Store wallet info
          await AsyncStorage.setItem('solanaAddress', walletResult.walletAddress);
          await AsyncStorage.setItem('authToken', walletResult.authToken);
          await AsyncStorage.setItem('username', defaultUsername);

          return registerResponse.data;
        }
        
        throw loginError;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      // Disconnect wallet
      await disconnectWallet();
      
      // Clear stored data
      await AsyncStorage.removeItem('solanaAddress');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('username');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const solanaAddress = await AsyncStorage.getItem('solanaAddress');
      if (!solanaAddress) {
        return null;
      }

      const response = await api.get('/auth/me', {
        headers: {
          'x-solana-address': solanaAddress
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async getUserProfile(userId) {
    try {
      const response = await api.get(`/auth/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  async isAuthenticated() {
    try {
      const isConnected = await isWalletConnected();
      if (!isConnected) {
        return false;
      }

      // Verify with backend
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  },

  async getWalletAddress() {
    return await AsyncStorage.getItem('solanaAddress');
  },

  async getUsername() {
    return await AsyncStorage.getItem('username');
  },

  async getUserWithAnalysis() {
    try {
      const solanaAddress = await AsyncStorage.getItem('solanaAddress');
      if (!solanaAddress) {
        return null;
      }

      const response = await api.get('/auth/profile/me', {
        headers: {
          'x-solana-address': solanaAddress
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get user with analysis error:', error);
      return null;
    }
  }
}; 