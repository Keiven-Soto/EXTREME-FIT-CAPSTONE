import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Platform-specific token cache
// On web, expo-secure-store doesn't work properly, so we use localStorage
// On native platforms, we use expo-secure-store for better security

const createTokenCache = () => {
  if (Platform.OS === 'web') {
    // Web implementation using localStorage
    return {
      getToken: async (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error getting token from localStorage:', error);
          return null;
        }
      },
      saveToken: async (key, token) => {
        try {
          localStorage.setItem(key, token);
        } catch (error) {
          console.error('Error saving token to localStorage:', error);
        }
      },
      clearToken: async (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error clearing token from localStorage:', error);
        }
      },
    };
  } else {
    // Native implementation using expo-secure-store
    return {
      getToken: async (key) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.error('Error getting token from SecureStore:', error);
          return null;
        }
      },
      saveToken: async (key, token) => {
        try {
          await SecureStore.setItemAsync(key, token);
        } catch (error) {
          console.error('Error saving token to SecureStore:', error);
        }
      },
      clearToken: async (key) => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error('Error clearing token from SecureStore:', error);
        }
      },
    };
  }
};

export const tokenCache = createTokenCache();
