import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import { useUser, useAuth } from "@clerk/clerk-expo";
import ApiService, { setGlobalAuthToken } from "../services/api";
import { useCurrentUser } from "../hooks/useAuthenticatedApi";
import { useWishlist } from "../hooks/useWishlist";

// Dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function CategoryProducts({ route, navigation }) {
  const { category_id, category_name, gender } = route.params;
  const { user: clerkUser } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();

  // Local state for user ID
  const [userId, setUserId] = useState(null);

  // Products list state
  const [products, setProducts] = useState([]);
  const { wishlist, add, remove } = useWishlist();

  // Loading state while fetching products
  const [loading, setLoading] = useState(true);

  // Fetch and set user ID and auth token whenever auth state changes
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (clerkUser && isSignedIn) {
        try {
          const token = await getToken();
          console.log("[Category] Setting global token:", !!token);
          setGlobalAuthToken(token);

          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            setUserId(userData.user_id);
            console.log("[Category] Obtained User ID");
          } else {
            console.log("[Category] Could not get User ID");
          }
        } catch (error) {
          console.error("[Category] Error fetching User ID:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [clerkUser, isSignedIn]);

  // Load products once userId is available
  useEffect(() => {
    if (userId !== null) {
      loadProducts();
    }
  }, [userId]);

  // Fetch products from API for this category
  const loadProducts = async () => {
    try {
      setLoading(true);
      const prodRes = await ApiService.products.getByCategory(category_id);
      if (prodRes.success) {
        setProducts(prodRes.data || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("[Category] loadProducts error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Render a single product card
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
        {/* Product Image */}
        <Image
          source={imageSource}
          style={styles.productImage}
          onError={() =>
            console.log(
              "[Category] Image failed to load for product:",
              product.name
            )
          }
        />
        {/* Product Info */}
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

            {/* Wishlist Icon */}
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

  // Toggle wishlist state for a product
  const handleWishlistToggle = async (product) => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to manage your wishlist");
      return;
    }

    const isWishlisted = wishlist.includes(product.product_id);

    if (isWishlisted) {
      remove(product);
    } else {
      add(product);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.mainContent}>
        <ScrollView showVerticalScrollIndicator={true}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {gender} - {category_name}
            </Text>
          </View>

          {/* Products Grid */}
          <View style={styles.productsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.mainColor} />
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : products.length > 0 ? (
              <View style={styles.productsGrid}>
                {products.map(renderProduct)}
              </View>
            ) : (
              <Text style={styles.noResults}>No products available 😢</Text>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Main", { screen: "Home" })}
        >
          <Ionicons
            name="home-outline"
            size={24}
            color={Colors.grayIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Main", { screen: "Shop" })}
        >
          <Ionicons
            name="search-outline"
            size={24}
            color={Colors.grayIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Main", { screen: "Bag" })}
        >
          <Ionicons
            name="bag-outline"
            size={24}
            color={Colors.grayIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Main", { screen: "Wishlist" })}
        >
          <Ionicons
            name="heart-outline"
            size={24}
            color={Colors.grayIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Main", { screen: "Me" })}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={Colors.grayIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Card width for 2-column layout
const CARD_WIDTH = (width - 16 * 3) / 2;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  mainContent: {
    flex: 1,
  },

  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 5,
    textTransform: "capitalize",
  },

  backButton: {
    padding: 8,
    paddingBottom: 12,
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

  productImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },

  productInfo: {
    width: "100%",
    padding: 8,
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.darkText,
    marginBottom: 5,
  },

  productPrice: {
    fontSize: 14,
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

  productsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
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

  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: Colors.mutedText,
    fontStyle: "italic",
    paddingVertical: 20,
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: Colors.whiteBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.lightBorder,
    height: 90,
    paddingBottom: 25,
    paddingTop: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
