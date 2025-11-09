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
import ApiService from "../services/api";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import Colors from "../colors";

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function ShopScreen({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  // NEW: Search products whenever searchText changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        searchProducts(searchText);
      } else {
        loadProducts();
      }
    }, 400); // Wait 400ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await ApiService.products.getAll();

      if (result.success) {
        setProducts(result.data);
      } else {
        Alert.alert("Error", "Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

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
    // No need to call loadProducts() - useEffect will handle it
  };

  const renderProduct = (product) => {
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

        {/* Wrap text in a container */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.productPrice}>
            ${parseFloat(product.price).toFixed(2)}
          </Text>
          {product.gender && (
            <Text style={styles.productGender}>{product.gender}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
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
    flex: 1,
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