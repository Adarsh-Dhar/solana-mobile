import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Solana wallet address
api.interceptors.request.use(
  async (config) => {
    const solanaAddress = await AsyncStorage.getItem('solanaAddress');
    if (solanaAddress) {
      config.headers['x-solana-address'] = solanaAddress;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored authentication data on auth error
      await AsyncStorage.removeItem('solanaAddress');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('username');
    }
    return Promise.reject(error);
  }
);

export default api; 