// services/api.js
import Constants from 'expo-constants';

// API Configuration with improved network detection
const getApiUrl = () => {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
      console.log('Using Expo debugger host:', debuggerHost);
      return `http://${debuggerHost}:5001`;
    }
    
    console.log('Falling back to localhost');
    return 'http://localhost:5001';
  }
  return 'https://your-production-api.com';
};

const API_BASE_URL = getApiUrl();
console.log('API Base URL:', API_BASE_URL);

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    timeout: 10000, // 10 second timeout
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log(`API Request: ${config.method || 'GET'} ${url}`);
    
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
    return { success: true, data };
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error.message);
    
    // Provide helpful error messages for common issues
    let userFriendlyMessage = error.message;
    
    if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
      userFriendlyMessage = 'Cannot connect to server. Make sure the backend is running and you\'re on the same network.';
    } else if (error.message.includes('Connection refused')) {
      userFriendlyMessage = 'Backend server is not running. Please start the server and try again.';
    }
    
    return { 
      success: false, 
      error: userFriendlyMessage,
      originalError: error.message 
    };
  }
};

// API Service Object
export const ApiService = {
  // Test connection
  testConnection: async () => {
    console.log('Testing connection to:', API_BASE_URL);
    const result = await apiRequest('/api/test-db');
    
    if (result.success) {
      console.log('Server connection successful!');
    } else {
      console.log('Server connection failed:', result.error);
    }
    
    return result;
  },

  // User Management
  users: {
    // Create new user
    create: async (userData) => {
      return await apiRequest('/api/users', {
        method: 'POST',
        body: userData,
      });
    },

    // Get all users
    getAll: async () => {
      return await apiRequest('/api/users');
    },

    // Get user by ID
    getById: async (userId) => {
      return await apiRequest(`/api/users/${userId}`);
    },

    // Update user
    update: async (userId, userData) => {
      return await apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: userData,
      });
    },

    // Delete user
    delete: async (userId) => {
      return await apiRequest(`/api/users/${userId}`, {
        method: 'DELETE',
      });
    },
  },

  // Products Management (future endpoints)
  products: {
    getAll: async () => {
      return await apiRequest('/api/products');
    },
    getById: async (productId) => {
      return await apiRequest(`/api/products/${productId}`);
    },
    search: async (query) => {
      return await apiRequest(`/api/products/search?q=${encodeURIComponent(query)}`);
    },
    getByCategory: async (category) => {
      return await apiRequest(`/api/products/category/${category}`);
    },
  },

  // Cart Management (future endpoints)
  cart: {
    get: async (userId) => {
      return await apiRequest(`/api/cart/${userId}`);
    },
    addItem: async (userId, productId, quantity = 1) => {
      return await apiRequest('/api/cart/add', {
        method: 'POST',
        body: { userId, productId, quantity },
      });
    },
    removeItem: async (userId, productId) => {
      return await apiRequest('/api/cart/remove', {
        method: 'DELETE',
        body: { userId, productId },
      });
    },
    updateQuantity: async (userId, productId, quantity) => {
      return await apiRequest('/api/cart/update', {
        method: 'PUT',
        body: { userId, productId, quantity },
      });
    },
  },

  // Orders Management (future endpoints)
  orders: {
    create: async (orderData) => {
      return await apiRequest('/api/orders', {
        method: 'POST',
        body: orderData,
      });
    },
    getByUser: async (userId) => {
      return await apiRequest(`/api/orders/user/${userId}`);
    },
    getById: async (orderId) => {
      return await apiRequest(`/api/orders/${orderId}`);
    },
  },

  // Wishlist Management (future endpoints)
  wishlist: {
    get: async (userId) => {
      return await apiRequest(`/api/wishlist/${userId}`);
    },
    add: async (userId, productId) => {
      return await apiRequest('/api/wishlist/add', {
        method: 'POST',
        body: { userId, productId },
      });
    },
    remove: async (userId, productId) => {
      return await apiRequest('/api/wishlist/remove', {
        method: 'DELETE',
        body: { userId, productId },
      });
    },
  },

  // Addresses Management
  addresses: {
    // Obtener todas las direcciones de un usuario
    getByUser: async (userId) => {
      return await apiRequest(`/api/addresses/user/${userId}`);
    },

    // Crear una nueva dirección
    create: async (userId, addressData) => {
      return await apiRequest(`/api/addresses/user/${userId}`, {
        method: 'POST',
        body: addressData,
      });
    },

    // Actualizar una dirección existente
    update: async (addressId, addressData) => {
      return await apiRequest(`/api/addresses/${addressId}`, {
        method: 'PUT',
        body: addressData,
      });
    },

    // Eliminar una dirección
    delete: async (addressId) => {
      return await apiRequest(`/api/addresses/${addressId}`, {
        method: 'DELETE',
      });
    },
  },
};

// Export base URL for direct access if needed
export { API_BASE_URL };

export default ApiService;