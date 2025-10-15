import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';

const USE_NGROK = true;

const getApiUrl = () => {
  if (__DEV__) {
    if (USE_NGROK) {
      return 'https://unpaining-cris-scorningly.ngrok-free.dev';
    }

    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
      return `http://${debuggerHost}:5001`;
    }

    return 'http://localhost:5001';
  }
  return 'https://your-production-api.com';
};

const API_BASE_URL = getApiUrl();

/**
 * Hook to make authenticated API requests with Clerk JWT
 * This ensures the token is always fresh and valid
 */
export const useAuthenticatedApi = () => {
  const { getToken } = useAuth();

  const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      // Get fresh JWT token from Clerk
      const token = await getToken();

      if (!token) {
        throw new Error('No authentication token available');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        timeout: 10000,
        ...options,
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      console.log(`Token present: ${!!token}`);

      const response = await Promise.race([
        fetch(url, config),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), config.timeout)
        )
      ]);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log(`API Success: ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error.message);

      let userFriendlyMessage = error.message;

      if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
        userFriendlyMessage = 'Cannot connect to server. Make sure the backend is running.';
      } else if (error.message.includes('No authentication token')) {
        userFriendlyMessage = 'Please log in again.';
      }

      return {
        success: false,
        error: userFriendlyMessage,
        originalError: error.message
      };
    }
  };

  return {
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
    post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
    put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  };
};

/**
 * Hook to get current authenticated user
 */
export const useCurrentUser = () => {
  const api = useAuthenticatedApi();

  const getCurrentUser = async () => {
    return await api.get('/api/users/me');
  };

  return { getCurrentUser };
};
