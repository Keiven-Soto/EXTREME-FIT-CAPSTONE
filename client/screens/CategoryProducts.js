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
import ApiService from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCloudinaryImageUrl } from "../utils/cloudinary";

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function CategoryProducts({ route, navigation }) {
  const { category_id, category_name, gender } = route.params;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    loadProducts(category_id);
  }, [category_id]);

  const loadProducts = async (category_id) => {
    try {
      setLoading(true);
      const result = await ApiService.products.getByCategory(category_id);

      if (result.success) {
        // Handle the successful response, e.g., set state with products
        setProducts(result.data);
      } else {
        Alert.alert("Error", "Failed to load products for the category");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = (product) => {
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
            console.log("Image failed to load for product:", product.name)
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
            <Pressable
              style={styles.productIcon}
              onPress={() => handleFavorite(product)}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={18}
                color={isWishlisted ? Colors.mainColor : Colors.darkText}
              />
            </Pressable>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

    function handleFavorite(product) {
      Alert.alert("Coming soon!");
    }

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
