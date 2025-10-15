// services/api.js
import Constants from 'expo-constants';

// Global token storage (set by components using useAuth)
let globalToken = null;

export const setGlobalAuthToken = (token) => {
  globalToken = token;
  console.log('🎫 Global token set:', !!token);
};

const USE_NGROK = true;
// API Configuration with improved network detection
const getApiUrl = () => {
  if (__DEV__) {
    if (USE_NGROK) {
      return 'https://unpaining-cris-scorningly.ngrok-free.dev'; //TODO: replace with your ngrok URL
    }
    
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
      console.log('Using Expo debugger host:', debuggerHost);
      return `http://${debuggerHost}:5001`;
    }

    console.log("Falling back to localhost");
    return "http://localhost:5001";
  }
  return "https://your-production-api.com";
};

const API_BASE_URL = getApiUrl();
console.log("API Base URL:", API_BASE_URL);

// Generic API request function with JWT authentication
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Use the globally set token
  const token = globalToken;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    timeout: 10000, // 10 second timeout
    ...options,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log(`API Request: ${config.method || "GET"} ${url}`);

    const response = await Promise.race([
      fetch(url, config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), config.timeout)
      ),
    ]);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log(`API Success: ${endpoint}`);
    // Backend returns {success: true, data: ...}, so just return it as-is
    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error.message);

    // Provide helpful error messages for common issues
    let userFriendlyMessage = error.message;

    if (
      error.message.includes("Network request failed") ||
      error.message.includes("timeout")
    ) {
      userFriendlyMessage =
        "Cannot connect to server. Make sure the backend is running and you're on the same network.";
    } else if (error.message.includes("Connection refused")) {
      userFriendlyMessage =
        "Backend server is not running. Please start the server and try again.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
      originalError: error.message,
    };
  }
};

// API Service Object
export const ApiService = {
  // Test connection
  testConnection: async () => {
    console.log("Testing connection to:", API_BASE_URL);
    const result = await apiRequest("/api/test-db");

    if (result.success) {
      console.log("Server connection successful!");
    } else {
      console.log("Server connection failed:", result.error);
    }

    return result;
  },

  // User Management
  users: {
    // Get current authenticated user
    getCurrentUser: async () => {
      return await apiRequest('/api/users/me');
    },

    // Create new user
    create: async (userData) => {
      return await apiRequest("/api/users", {
        method: "POST",
        body: userData,
      });
    },

    // Get all users
    getAll: async () => {
      return await apiRequest("/api/users");
    },

    // Get user by ID
    getById: async (userId) => {
      return await apiRequest(`/api/users/${userId}`);
    },

    // Update user
    update: async (userId, userData) => {
      return await apiRequest(`/api/users/${userId}`, {
        method: "PUT",
        body: userData,
      });
    },

    // Delete user
    delete: async (userId) => {
      return await apiRequest(`/api/users/${userId}`, {
        method: "DELETE",
      });
    },
  },

  // Products Management
  products: {
    // Get all products
    getAll: async () => {
      return await apiRequest("/api/products");
    },

    // Get all genders
    getGenders: async () => {
      return await apiRequest("/api/products/genders");
    },

    // Get product by ID
    getById: async (productId) => {
      return await apiRequest(`/api/products/${productId}`);
    },

    create: async (productData) => {
      return await apiRequest("/api/products", {
        method: "POST",
        body: productData,
      });
    },

    update: async (productId, productData) => {
      return await apiRequest(`/api/products/${productId}`, {
        method: "PUT",
        body: productData,
      });
    },

    delete: async (productId) => {
      return await apiRequest(`/api/products/${productId}`, {
        method: "DELETE",
      });
    },

    search: async (query) => {
      return await apiRequest(
        `/api/products/search?q=${encodeURIComponent(query)}`
      );
    },

    // Get products by category
    getByCategory: async (categoryId) => {
      return await apiRequest(`/api/products/category/${categoryId}`);
    },
  },

  // Orders Management
  orders: {
    create: async (orderData) => {
      return await apiRequest("/api/orders", {
        method: "POST",
        body: orderData,
      });
    },
    getAll: async () => {
      return await apiRequest("/api/orders");
    },
    getByUser: async (userId) => {
      return await apiRequest(`/api/orders/user/${userId}`);
    },
    getById: async (orderId) => {
      return await apiRequest(`/api/orders/${orderId}`);
    },
    getOrderItems: async (orderId) => {
      return await apiRequest(`/api/orders/${orderId}/items`);
    },
    addOrderItem: async (orderId, itemData) => {
      return await apiRequest(`/api/orders/${orderId}/items`, {
        method: "POST",
        body: itemData,
      });
    },
  },

  // Cart Management
  cart: {
    // Get cart items by user ID
    get: async (userId) => {
      return await apiRequest(`/api/cart/${userId}`);
    },

    // Add item to cart
    addItem: async (userId, productId, quantity, size, color) => {
      return await apiRequest("/api/cart/add", {
        method: "POST",
        body: { userId, productId, quantity, size, color },
      });
    },

    // Remove item from cart
    removeItem: async (userId, productId) => {
      return await apiRequest("/api/cart/remove", {
        method: "DELETE",
        body: { userId, productId },
      });
    },

    // Update exisitng cart item quantity
    updateQuantity: async (userId, productId, quantity) => {
      return await apiRequest("/api/cart/update", {
        method: "PUT",
        body: { userId, productId, quantity },
      });
    },

    // Clear all items from cart for a user
    clear: async (userId) => {
      return await apiRequest(`/api/cart/clear/${userId}`, {
        method: "DELETE"
      });
    },
  },

  // Wishlist Management (future endpoints)
  wishlist: {
    // Get wishlist items for a user
    get: async (userId) => {
      return await apiRequest(`/api/wishlist/${userId}`);
    },

    getById: async (userId, productId) => {
      return await apiRequest(`/api/wishlist/${userId}/${productId}`);
    },

    // Add item to wishlist
    add: async (userId, productId) => {
      return await apiRequest("/api/wishlist/add", {
        method: "POST",
        body: { userId, productId },
      });
    },

    // Remove item from wishlist
    remove: async (userId, productId) => {
      return await apiRequest(`/api/wishlist/remove`, {
        method: "DELETE",
        body: { userId, productId },
      });
    },
  },

  // Addresses Management
  addresses: {
    // Get all addresses for a user
    getByUser: async (userId) => {
      return await apiRequest(`/api/addresses/user/${userId}`);
    },

    // Create a new address
    create: async (userId, addressData) => {
      return await apiRequest(`/api/addresses/user/${userId}`, {
        method: "POST",
        body: addressData,
      });
    },

    // Update an existing address
    update: async (addressId, addressData) => {
      return await apiRequest(`/api/addresses/${addressId}`, {
        method: "PUT",
        body: addressData,
      });
    },

    // Delete an address
    delete: async (addressId) => {
      return await apiRequest(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });
    },
  },

  categories: {
    // Get all categories
    getAll: async () => {
      return await apiRequest("/api/categories");
    },

    // Get categories filtered by gender
    getByGender: async (gender) => {
      return await apiRequest(`/api/categories/${gender}`);
    },
  },
};

// Export base URL for direct access if needed
export { API_BASE_URL };

export default ApiService;
