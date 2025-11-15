import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
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

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function CategoryProducts({ route, navigation }) {
  const { category_id, category_name, gender } = route.params;
  const { user: clerkUser } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();

  const [userId, setUserId] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // products will be annotated with `isWishlisted` after merging with wishlist

  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (clerkUser && isSignedIn) {
        try {
          // Get and set the token
          const token = await getToken();
          console.log("[Category] Setting global token:", !!token);
          setGlobalAuthToken(token);
          setTokenReady(true);

          // Get user data
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            setUserId(userData.user_id);
            console.log("[Category] Obtained User ID");
          } else {
            console.log("[Category] Could not get User ID");
          }
        } catch (error) {
          console.error("[Category] Error fetching  User ID:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [clerkUser, isSignedIn]);

  // Fetch products + wishlist when category_id or userId changes
  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);

        // JavaScript
        const results = await Promise.allSettled([
          ApiService.products.getByCategory(category_id),
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

        if (prodRes && prodRes.success && mounted) {
          const merged = (prodRes.data || []).map((p) => ({
            ...p,
            isWishlisted: wishlistIds.has(String(p.product_id)),
          }));
          setProducts(merged);
        } else if (!prodRes || !prodRes.success) {
          console.log(
            "[Category] Failed to load products for category"
          );
          setProducts([]);
        }
      } catch (err) {
        console.error(
          "[Category] Failed to load products or wishlist:",
          err
        );
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [category_id, userId]);

  const renderProduct = (product) => {
    const isProductWishlisted = !!product.isWishlisted;
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
          {/* Product Name & Price */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.productPrice}>
            ${parseFloat(product.price).toFixed(2)}
          </Text>

          {/* Product Info Footer */}
          <View style={styles.productInfoFooter}>
            {/* Gender */}
            {product.gender && (
              <Text style={styles.productGender}>{product.gender}</Text>
            )}

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
        console.log("[Category] Successfully added to wishlist.");
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
        console.log("[Category] Failed to add to wishlist.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server");
      console.log(
        "[Category] Error connecting to server for wishlist add."
      );
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const wishlistRes = await ApiService.wishlist.remove(userId, productId);
      if (wishlistRes.success) {
        console.log("[Category] Successfully removed from wishlist.");
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === productId ? { ...p, isWishlisted: false } : p
          )
        );
      } else {
        console.log("[Category] Failed to remove from wishlist.");
        // leave the set unchanged on failure
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server");
      console.log(
        "[Category] Error connecting to server for wishlist remove."
      );
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
    <SafeAreaView style={styles.screenContainer}>
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
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 16 * 3) / 2;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  header: {
    padding: 20,
    paddingTop: 20,
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

  headerSubtitle: {
    fontSize: 16,
    color: Colors.mutedText,
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
});
