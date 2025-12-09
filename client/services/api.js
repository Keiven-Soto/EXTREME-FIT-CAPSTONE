// services/api.js
import Constants from 'expo-constants';

// Global token storage (set by components using useAuth)
let globalToken = null;

export const setGlobalAuthToken = (token) => {
  globalToken = token;
  console.log('🎫 Global token set:', !!token);
};

const USE_NGROK = true;
const FORCE_PRODUCTION = false; 

const getApiUrl = () => {
  if (FORCE_PRODUCTION) {
    console.log('⚠️ FORCE_PRODUCTION enabled - using production API');
    return "https://extreme-fit-capstone-backend.vercel.app";
  }

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

  console.log('🚀 Using production API');
  return "https://extreme-fit-capstone-backend.vercel.app";
};

// Make base URL overridable at runtime (useful when ngrok URL changes)
let API_BASE_URL = getApiUrl();
export const setApiBaseUrl = (url) => {
  API_BASE_URL = url;
  console.log('🔁 API base URL overridden:', url);
};
console.log("API Base URL:", API_BASE_URL);

// Generic API request function with JWT authentication
const apiRequest = async (endpoint, options = {}) => {
  const base = options.baseUrl || API_BASE_URL;
  const url = `${base}${endpoint}`;
  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

  // Token resolution order: options.token > options.headers.Authorization > globalToken
  const resolvedToken =
    options.token ||
    (options.headers && (options.headers.Authorization || options.headers.authorization)) ||
    globalToken;

  // Normalize headers and inject Authorization only if not already present
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  if (resolvedToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const config = {
    headers,
    timeout: 10000, // 10 second timeout
    ...options,
  };

  // Only stringify plain objects (avoid double-stringify)
  if (config.body && typeof config.body === "object" && !(config.body instanceof String)) {
    config.body = JSON.stringify(config.body);
  }

  try {

    const response = await Promise.race([
      fetch(url, config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), config.timeout)
      ),
    ]);

    // Try to get response text first
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Return a structured error when server responds with non-JSON
      console.error('❌ Failed to parse JSON response:', parseError.message);
      console.error('Response received (truncated):', responseText.substring(0, 200));
      return {
        success: false,
        error: `Server returned non-JSON response: ${responseText.substring(0, 200)}`,
        originalResponse: responseText,
        status: response.status,
      };
    }

    if (!response.ok) {
      console.error(`❌ API Error (${response.status}):`, data.error || data);
      return {
        success: false,
        error: data.error || data.message || `HTTP error! status: ${response.status}`,
        status: response.status,
        originalResponse: responseText,
      };
    }

    // Backend returns {success: true, data: ...}, so just return it as-is
    // Ensure data has expected properties to avoid undefined errors
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Unexpected response format from API:', data);
      return {
        success: true,
        data: data,
      };
    }
    return data;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error.message);

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

    // UPGRADED: Search products with fuzzy matching and optional filters
    search: async (query, options = {}) => {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Required: search query
      params.append('q', query);
      
      // Optional: gender filter
      if (options.gender) {
        params.append('gender', options.gender);
      }
      
      // Optional: color filter
      if (options.color) {
        params.append('color', options.color);
      }
      
      // Optional: threshold (default is 0.5 in backend)
      if (options.threshold !== undefined) {
        params.append('threshold', options.threshold);
      }
      
      return await apiRequest(`/api/products/search?${params.toString()}`);
    },

    // Get products by category
    getByCategory: async (categoryId) => {
      return await apiRequest(`/api/products/category/${categoryId}`);
    },
    // Adjust stock for a product (size-based). payload: { size, quantity, operation }
    adjustStock: async (productId, payload) => {
      return await apiRequest(`/api/products/${productId}/adjust-stock`, {
        method: 'POST',
        body: payload,
      });
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

    // Set an address as the default (uses server endpoint that doesn't require full payload)
    setDefault: async (addressId) => {
      return await apiRequest(`/api/addresses/${addressId}/set-default`, {
        method: 'PUT',
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

  // Payments Management

payments: {
  // Create PaymentIntent for mobile Payment Sheet
  createPaymentIntent: async (orderId) => {
    return await apiRequest('/api/payments/create-payment-intent', {
      method: 'POST',
      body: { order_id: orderId },
    });
  },

  // Create Checkout Session (for web, kept for reference)
  createCheckoutSession: async (orderId, cancelUrl, successUrl) => {
    return await apiRequest('/api/payments/create-checkout-session', {
      method: 'POST',
      body: {
        order_id: orderId,
        cancel_url: cancelUrl,
        success_url: successUrl,
      },
    });
  },
},
};

// Export base URL for direct access if needed
export { API_BASE_URL };

export default ApiService;
