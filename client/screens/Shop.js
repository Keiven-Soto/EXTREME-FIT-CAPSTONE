import { useState, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import { useUser, useAuth } from "@clerk/clerk-expo";
import ApiService, { setGlobalAuthToken } from "../services/api";
import { useCurrentUser } from "../hooks/useAuthenticatedApi";
import Colors from "../colors";
import CornerLogo from "../components/CornerLogo";
// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function ShopScreen({ navigation }) {
  const { user: clerkUser } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();

  const [userId, setUserId] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get auth state
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (clerkUser && isSignedIn) {
        try {
          // Get and set the token
          const token = await getToken();
          console.log("[Shop] Setting global token:", !!token);
          setGlobalAuthToken(token);
          setTokenReady(true);

          // Get user data
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            setUserId(userData.user_id);
            console.log("[Shop] Obtained User ID");
          } else {
            console.log("[Shop] Could not get User ID");
          }
        } catch (error) {
          console.error("[Shop] Error fetching  User ID:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [clerkUser, isSignedIn]);

  // Load products function - accessible throughout component
  const loadProducts = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        ApiService.products.getAll(),
        userId
          ? ApiService.wishlist.get(userId)
          : Promise.resolve({
              status: "fulfilled",
              value: { success: true, data: [] },
            }),
      ]);

      const prodRes =
        results[0].status === "fulfilled" ? results[0].value : null;
      const wishRes =
        results[1].status === "fulfilled"
          ? results[1].value
          : { success: true, data: [] };

      const wishlistIds = new Set(
        (wishRes?.data || [])
          .map((i) => i.product_id ?? i.productId ?? i.product)
          .filter((id) => id != null)
          .map((id) => String(id))
      );

      if (prodRes && prodRes.success) {
        const merged = (prodRes.data || []).map((p) => ({
          ...p,
          isWishlisted: wishlistIds.has(String(p.product_id)),
        }));
        setProducts(merged);
      } else if (!prodRes || !prodRes.success) {
        console.log("[Shop] Failed to load products for category");
        setProducts([]);
      }
    } catch (err) {
      console.error("[Shop] Failed to load products or wishlist:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products + wishlist when userId changes
  useEffect(() => {
    loadProducts();
  }, [userId]);

  // NEW: Search products function
  const searchProducts = async (query) => {
    try {
      setLoading(true);
      const result = await ApiService.products.search(query);

      if (result.success) {
        setProducts(result.data);
      } else {
        Alert.alert("Error", "Failed to search products");
      }
    } catch (error) {
      console.error("Error searching products:", error);
      Alert.alert("Error", "Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    loadProducts();
  };

  // NEW: Search products whenever searchText changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = searchText.trim();
      if (q) {
        searchProducts(q);
        return;
      }

      // If search is cleared, reload all products + wishlist
      (async () => {
        try {
          setLoading(true);

          const results = await Promise.allSettled([
            ApiService.products.getAll(),
            userId
              ? ApiService.wishlist.get(userId)
              : Promise.resolve({ status: "fulfilled", value: { success: true, data: [] } }),
          ]);

          const prodRes = results[0].status === "fulfilled" ? results[0].value : null;
          const wishRes = results[1].status === "fulfilled" ? results[1].value : { success: true, data: [] };

          const wishlistIds = new Set(
            (wishRes?.data || [])
              .map((i) => i.product_id ?? i.productId ?? i.product)
              .filter((id) => id != null)
              .map((id) => String(id))
          );

          if (prodRes && prodRes.success) {
            const merged = (prodRes.data || []).map((p) => ({
              ...p,
              isWishlisted: wishlistIds.has(String(p.product_id)),
            }));
            setProducts(merged);
          } else {
            setProducts([]);
          }
        } catch (err) {
          console.error("[Shop] Failed to reload products:", err);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText, userId]);

  const renderProduct = (product) => {
    const isProductWishlisted = !!product.isWishlisted;

    // Get image source
    const getImageSource = () => {
      if (product.cloudinary_public_id) {
        const imageUrl = getCloudinaryImageUrl(product.cloudinary_public_id, {
          format: "auto",
        });
        return { uri: imageUrl };
      }
      return null;
    };

    const imageSource = getImageSource();

    return (
      <TouchableOpacity
        key={product.product_id}
        style={styles.productCard}
        onPress={() =>
          navigation.navigate("ProductDetails", {
            productId: product.product_id,
          })
        }
      >
        <Image
          source={imageSource}
          style={styles.productImage}
          onError={() =>
            console.log(
              "[Shop] Image failed to load for product:",
              product.name
            )
          }
        />

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Product Name & Price */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Product Info Footer */}
          <View style={styles.productInfoFooter}>
            <View style={{ flexDirection: "column", gap: 3 }}>
              {/* Gender */}
              {product.gender && (
                <Text style={styles.productGender}>{product.gender}</Text>
              )}

              {/* Price */}
              <Text style={styles.productPrice}>
                ${parseFloat(product.price).toFixed(2)}
              </Text>
            </View>

            {/* Wishlist Icon */}
            <TouchableOpacity
              style={styles.productIcon}
              onPress={() => handleWishlistToggle(product)}
            >
              <Ionicons
                name={isProductWishlisted ? "heart" : "heart-outline"}
                size={22}
                color={isProductWishlisted ? Colors.mainColor : Colors.darkText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const addToWishlist = async (product) => {
    try {
      const wishlistRes = await ApiService.wishlist.add(
        userId,
        product.product_id
      );

      if (wishlistRes.success) {
        Alert.alert("Added to Wishlist", `${product.name}`, [{ text: "OK" }]);
        console.log("[Shop] Successfully added to wishlist.");
        // annotate product in products array
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === product.product_id
              ? { ...p, isWishlisted: true }
              : p
          )
        );
      } else {
        Alert.alert("Error", wishlistRes.error || "Could not add to wishlist");
        console.log("[Shop] Failed to add to wishlist.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server");
      console.log("[Shop] Error connecting to server for wishlist add.");
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const wishlistRes = await ApiService.wishlist.remove(userId, productId);
      if (wishlistRes.success) {
        console.log("[Shop] Successfully removed from wishlist.");
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === productId ? { ...p, isWishlisted: false } : p
          )
        );
      } else {
        console.log("[Shop] Failed to remove from wishlist.");
        // leave the set unchanged on failure
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server");
      console.log("[Shop] Error connecting to server for wishlist remove.");
    }
  };

  const handleWishlistToggle = async (product) => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to manage your wishlist");
      return;
    }

    const productIsWishlisted = !!product.isWishlisted;

    if (!productIsWishlisted) {
      addToWishlist(product);
    } else {
      Alert.alert(
        "Remove from wishlist?",
        `Are you sure you want to remove "${product.name}" from your wishlist?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              removeFromWishlist(product.product_id);
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
          <CornerLogo></CornerLogo>
          <Text style={styles.headerSubtitle}>Find your athletic gear</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.grayIcon}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={Colors.grayIcon}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.grayIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* NEW: Search Results Info */}
        {searchText.trim() && !loading && products.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              Found {products.length} product{products.length !== 1 ? "s" : ""}{" "}
              for "{searchText}"
            </Text>
          </View>
        )}

        {/* Products */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Products</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>
                {searchText ? "Searching..." : "Loading products..."}
              </Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsGrid}>
              {products.map(renderProduct)}
            </View>
          ) : (
            // UPDATED: Enhanced no results section
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResults}>
                {searchText
                  ? `No products found for "${searchText}"`
                  : "No products available"}
              </Text>
              {searchText && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.clearSearchButtonText}>
                    View all products
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 16 * 3) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  header: {
    padding: 20,
    paddingTop: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 5,
  },

  headerSubtitle: {
    fontSize: 16,
    color: Colors.mutedText,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
  },

  clearButton: {
    padding: 5,
  },

  // NEW: Search results info styles
  searchResultsInfo: {
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
  },

  searchResultsText: {
    fontSize: 14,
    color: Colors.mutedText,
  },

  productsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 15,
  },

  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },

  productCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.whiteBackground,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },

  productInfo: {
    width: "100%",
    padding: 8,
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  productImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },

  productImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },

  placeholderText: {
    color: Colors.mutedText,
    fontSize: 12,
  },

  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.darkText,
    marginBottom: 5,
  },

  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.mainColor,
    marginBottom: 5,
  },

  productGender: {
    fontSize: 12,
    color: Colors.mutedText,
    textTransform: "capitalize",
  },

  productIcon: {
    fontSize: 12,
    color: Colors.grayIcon,
  },

  productInfoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.mutedText,
  },

  // UPDATED: Enhanced no results styles
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: Colors.mutedText,
    fontStyle: "italic",
    paddingVertical: 20,
  },

  clearSearchButton: {
    backgroundColor: Colors.mainColor,
    paddingHorizontal: 28,    
    paddingVertical: 14,       
    borderRadius: 50,          
    marginTop: 10,
    alignSelf: 'center',       
  },

  clearSearchButtonText: {
    color: Colors.whiteBackground,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  });
