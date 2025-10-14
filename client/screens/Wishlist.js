import { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../colors";
import ApiService from "../services/api";
import { getCloudinaryImageUrl } from "../utils/cloudinary";

export default function WishlistScreen( ) {
  const USER_ID = 1; // Placeholder for user ID

  const [wishlistItems, setWishlistItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000); // Stop refreshing after 2 seconds
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWishlist(USER_ID);
  }, [USER_ID, refreshing]);

  const loadWishlist = async (user_id) => {
    try {
      setLoading(true);
      const result = await ApiService.wishlist.get(user_id);

      if (result.success) {
        const enriched = await Promise.all(
          (result.data || []).map(async (it) => {
            const pRes = await ApiService.products.getById(it.product_id);
            const product = pRes.data?.data || pRes.data || null;
            return { ...it, product };
          })
        );

        setWishlistItems(enriched);
        setLoading(false);
      } else {
        Alert.alert("Info", result.error || "No wishlist items found.");
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("❌ Error loading wishlist:", error);
      Alert.alert("Error", "Failed to load wishlist items.");
    }
  };

  const renderItem = (item) => {
    // Get product details

    const product = item.product;

    if (!product) {
      // If product details are not loaded yet, show a placeholder
      return (
        <View key={item.wishlist_id} style={styles.wishlistItem}>
          <Text>Loading product data...</Text>
        </View>
      );
    }

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
      <View key={item.wishlist_id} style={styles.wishlistItem}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.productImage}
            onError={() =>
              console.log("Image failed to load for product:", product.name)
            }
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          <Text style={styles.productPrice}>
            ${parseFloat(product.price).toFixed(2)}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.addToBagButton}
              onPress={() => handleAddToCart()}
            >
              <Ionicons name="bag-add" size={16} color={Colors.whiteText} />
              <Text style={styles.addToBagText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleUnfavorite(product)}
            >
              <Ionicons
                name="heart-dislike"
                size={16}
                color={Colors.mainColor}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  function handleUnfavorite(product) {
    Alert.alert(
      "Remove from wishlist?",
      `Are you sure you want to remove "${product.name}" from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            // call API to remove and refresh list
            console.log(
              "Sent User ID and Product ID: ",
              USER_ID,
              product.product_id
            );
            await ApiService.wishlist.remove(USER_ID, product.product_id);
            loadWishlist(USER_ID);
          },
        },
      ]
    );
  }

  function handleAddToCart() {
    Alert.alert("Coming soon!");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSubtitle}>Your favorite products</Text>
        </View>

        {/* Wishlist Items */}
        <View style={styles.wishlistItems}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading favorites...</Text>
            </View>
          ) : wishlistItems.length > 0 ? (
            <View>{wishlistItems.map(renderItem)}</View>
          ) : (
            <Text style={styles.noResults}>No favorites added 😢</Text>
          )}
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            💡 Tip: Tap the ❤️ on any product to add it to your wishlist
          </Text>
        </View>

        <TouchableOpacity style={styles.continueShoppingButton}>
          <Ionicons name="storefront" size={20} color={Colors.mainColor} />
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  header: {
    padding: 20,
    paddingTop: 60,
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
  wishlistItems: {
    paddingHorizontal: 20,
  },
  wishlistItem: {
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    backgroundColor: Colors.lightBackground,
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productImageText: {
    fontSize: 24,
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.darkText,
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.mainColor,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  addToBagButton: {
    backgroundColor: Colors.mainColor,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    justifyContent: "center",
  },
  addToBagText: {
    color: Colors.whiteText,
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: Colors.lightBackground,
    width: 40,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.mainColor,
  },
  emptyState: {
    backgroundColor: Colors.whiteBackground,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 22,
  },
  continueShoppingButton: {
    backgroundColor: Colors.whiteBackground,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.mainColor,
  },
  continueShoppingText: {
    color: Colors.mainColor,
    fontSize: 18,
    fontWeight: "bold",
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
