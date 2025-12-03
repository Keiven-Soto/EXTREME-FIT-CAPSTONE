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
import { useWishlist } from "../hooks/useWishlist";

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function ShopScreen({ navigation }) {
  const { user: clerkUser } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();

  const [userId, setUserId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const { wishlist, add, remove } = useWishlist();
  const [loading, setLoading] = useState(true);

  // Get auth state and user ID
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (clerkUser && isSignedIn) {
        try {
          const token = await getToken();
          console.log("[Shop] Setting global token:", !!token);
          setGlobalAuthToken(token);

          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            setUserId(userData.user_id);
            console.log("[Shop] Obtained User ID");
          } else {
            console.log("[Shop] Could not get User ID");
          }
        } catch (error) {
          console.error("[Shop] Error fetching User ID:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [clerkUser, isSignedIn]);

  // Load products when userId changes
  useEffect(() => {
    if (userId) {
      loadProducts();
    }
  }, [userId]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = searchText.trim();
      loadProducts(q);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText, userId]);

  // Fetch products from API, optionally with search query
  const loadProducts = async (searchQuery = "") => {
    try {
      setLoading(true);

      const prodRes = searchQuery
        ? await ApiService.products.search(searchQuery)
        : await ApiService.products.getAll();

      if (!prodRes.success) {
        setProducts([]);
        return;
      }

      const wishlistIds = new Set(wishlist.map((p) => String(p.product_id)));
      const merged = (prodRes.data || []).map((p) => ({
        ...p,
        isWishlisted: wishlistIds.has(String(p.product_id)),
      }));

      setProducts(merged);
    } catch (err) {
      console.error("[Shop] loadProducts error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText("");
  };

  const renderProduct = (product) => {
    const isWishlisted = wishlist.includes(product.product_id);

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

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.productInfoFooter}>
            <View style={{ flexDirection: "column", gap: 3 }}>
              {product.gender && (
                <Text style={styles.productGender}>{product.gender}</Text>
              )}
              <Text style={styles.productPrice}>
                ${parseFloat(product.price).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.productIcon}
              onPress={() => handleWishlistToggle(product)}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={22}
                color={isWishlisted ? Colors.mainColor : Colors.darkText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleWishlistToggle = async (product) => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to manage your wishlist");
      return;
    }

    const isWishlisted = wishlist.includes(product.product_id);
    if (isWishlisted) remove(product);
    else add(product);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSubtitle}>Find your athletic gear</Text>
        </View>
        <View style={{ position: "absolute", top: 20, right: 20 }}>
          <CornerLogo/>
        </View>

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

        {searchText.trim() && !loading && products.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              Found {products.length} product{products.length !== 1 ? "s" : ""}{" "}
              for "{searchText}"
            </Text>
          </View>
        )}

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
  container: { flex: 1, backgroundColor: Colors.lightBackground },

  header: { padding: 20, paddingTop: 20 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 5,
  },
  headerSubtitle: { fontSize: 16, color: Colors.mutedText },

  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
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
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.darkText },
  clearButton: { padding: 5 },

  searchResultsInfo: {
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  searchResultsText: { fontSize: 14, color: Colors.mutedText },

  productsContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 15,
  },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },

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
  productImage: { width: "100%", height: 150, resizeMode: "cover" },
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
  productIcon: { fontSize: 12, color: Colors.grayIcon },
  productInfoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  loadingContainer: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: Colors.mutedText },

  noResultsContainer: { alignItems: "center", paddingVertical: 40 },
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
    alignSelf: "center",
  },
  clearSearchButtonText: {
    color: Colors.whiteBackground,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
