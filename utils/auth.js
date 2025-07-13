import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectWallet, disconnectWallet, isWalletConnected } from './solanaWallet';

export const authService = {
  async registerWithWallet(username) {
    try {
      // Connect wallet first
      const walletResult = await connectWallet();
      
      if (!walletResult.success) {
        throw new Error(walletResult.error || 'Failed to connect wallet');
      }

      // Register with backend
      const response = await api.post('/auth/register', {
        solanaAddress: walletResult.walletAddress,
        mobileAuthToken: walletResult.authToken,
        username
      });

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

      // Login with backend
      const response = await api.post('/auth/login', {
        solanaAddress: walletResult.walletAddress,
        mobileAuthToken: walletResult.authToken
      });

      // Store wallet info
      await AsyncStorage.setItem('solanaAddress', walletResult.walletAddress);
      await AsyncStorage.setItem('authToken', walletResult.authToken);

      return response.data;
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
  }
}; 