import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import ApiService from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import { ScrollView } from "react-native-web";

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

  const normalizeText = (text) => {
    return text
      ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
      : text;
  };

  const getImageSource = (product) => {
    if (product.cloudinary_public_id) {
      const imageUrl = getCloudinaryImageUrl(product.cloudinary_public_id, {
        format: "auto",
      });
      return { uri: imageUrl };
    }
    return null;
  };

  // const handleWishlistToggle = (product) => {
  //   setIsWishlisted(!isWishlisted);
  //   // TODO: Implement wishlist API call
  //   Alert.alert(
  //     isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
  //     product.name
  //   );
  // };

  return (
    <SafeAreaView style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {normalizeText(gender)} - {category_name}
        </Text>
      </View>

      {/* Products Grid */}
      <SafeAreaView >
        <FlatList
          data={products}
          keyExtractor={(item) => item.product_id}
          numColumns={2}
          ListEmptyComponent={<Text>No products available</Text>}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() =>
                navigation.navigate("ProductDetails", {
                  productId: item.product_id,
                })
              }
            >
              {/* Product Image */}
              <Image
                source={getImageSource(item)}
                style={styles.productImage}
                onError={() =>
                  console.log("Image failed to load for product:", item.name)
                }
              />

              {/* Product Info Container */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  ${parseFloat(item.price).toFixed(2)}
                </Text>

                {/* Product Info Footer */}
                <View style={styles.productInfoFooter}>
                  {/* Gender */}
                  {item.gender && (
                    <Text style={styles.productGender}>{item.gender}</Text>
                  )}

                  {/* Wishlist Icon */}
                  <Pressable style={styles.productIcon}>
                    <Ionicons
                      name={isWishlisted ? "heart" : "heart-outline"}
                      size={28}
                      color={isWishlisted ? Colors.mainColor : Colors.darkText}
                    />
                  </Pressable>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
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
    marginBottom: 16,
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },

  productInfo: {
    width: "100%",
    padding: 10,
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "left",
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
  },

  productGender: {
    fontSize: 12,
    color: Colors.mutedText,
    textTransform: "capitalize",
  },

  productIcon: {
    fontSize: 12,
    color: "#888",
    justifyContent: "flex-end",
  },

  productInfoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
