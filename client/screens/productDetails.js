import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import Colors from "../colors";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import ApiService from "../services/api";
import { useCurrentUser } from "../hooks/useAuthenticatedApi";
import emitter, { WISHLIST_UPDATED } from "../utils/events";
import { useWishlist } from "../hooks/useWishlist";

export default function ProductDetailScreen({ route, navigation }) {
  const { productId, isFromWishlist } = route.params;
  const { user: clerkUser } = useUser();
  const { getCurrentUser } = useCurrentUser();
  const [userId, setUserId] = useState(null);

  const [product, setProduct] = useState(null); // Product details
  const [loading, setLoading] = useState(true); // Loading state
  const [selectedSize, setSelectedSize] = useState(null); // User-selected size
  const [selectedColor, setSelectedColor] = useState(null); // User-selected color
  const [quantity, setQuantity] = useState(1); // Quantity to add to cart

  const { wishlist, add, remove } = useWishlist(); // Wishlist state
  const isWishlisted = wishlist.includes(productId); // Check if product is wishlisted

  // Fetch authenticated user's database ID
  useEffect(() => {
    const fetchUserId = async () => {
      if (clerkUser) {
        try {
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            setUserId(userData.user_id);
          }
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      }
    };
    fetchUserId();
  }, [clerkUser]);

  // Load product details whenever productId changes
  useEffect(() => {
    console.log(
      "🔄 ProductDetails useEffect triggered - productId:",
      productId
    );
    loadProduct();
  }, [productId]);

  // Fetch product details from API
  const loadProduct = async () => {
    console.log(
      "[ProductDetails] loadProduct called for productId:",
      productId
    );
    try {
      setLoading(true);
      const result = await ApiService.products.getById(productId);

      if (result.success) {
        const productData = result.data.data || result.data;
        setProduct(productData);

        // Reset selected size and color when loading new product
        setSelectedSize(null);
        setSelectedColor(null);
      } else {
        Alert.alert("Error", "Failed to load product");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading product:", error);
      Alert.alert("Error", "Failed to connect to server");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Handle adding product to cart
  const handleAddToCart = async () => {
    if (!userId) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your cart"
      );
      return;
    }
    if (!selectedSize) {
      Alert.alert("Select Size", "Please select a size before adding to cart");
      return;
    }
    if (!selectedColor) {
      Alert.alert(
        "Select Color",
        "Please select a color before adding to cart"
      );
      return;
    }

    try {
      const result = await ApiService.cart.addItem(
        userId,
        product.product_id,
        quantity,
        selectedSize,
        selectedColor
      );
      if (result.success) {
        // Fetch cart to update local data after adding item
        await ApiService.cart.get(userId);
        Alert.alert(
          "Added to Cart",
          `${product.name}\nSize: ${selectedSize}\nColor: ${selectedColor}\nQuantity: ${quantity}`,
          [
            {
              text: "Continue Shopping",
              onPress: () => navigation.goBack(),
              style: "cancel",
            },
            {
              text: "View Cart",
              onPress: () => navigation.navigate("Main", { screen: "Bag" }),
            },
          ],
          { cancelable: true }
        );
      } else {
        Alert.alert("Error", result.error || "Could not add to cart");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to server");
    }
  };

  // Toggle product in wishlist
  const handleWishlistToggle = async (product) => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in");
      return;
    }

    if (isWishlisted) {
      remove(product);
    } else {
      add(product);
    }
  };

  // Increment quantity while respecting stock limits
  const incrementQuantity = () => {
    if (
      product?.sizes &&
      selectedSize &&
      quantity < (product.sizes[selectedSize] || 0)
    ) {
      setQuantity(quantity + 1);
    }
  };

  // Decrement quantity, minimum 1
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.mainColor} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render fallback if product failed to load
  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine image source for product
  const imageSource = product.cloudinary_public_id
    ? {
        uri: getCloudinaryImageUrl(product.cloudinary_public_id, {
          format: "auto",
        }),
      }
    : null;

  // Compute total price based on quantity
  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back & Wishlist Buttons */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleWishlistToggle(product)}
            style={styles.wishlistButton}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={28}
              color={isWishlisted ? Colors.mainColor : Colors.darkText}
            />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={80}
                color={Colors.mutedText}
              />
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          {product.gender && (
            <Text style={styles.productGender}>
              {product.gender.toUpperCase()}
            </Text>
          )}

          <Text style={styles.productPrice}>
            ${parseFloat(product.price).toFixed(2)}
          </Text>

          {/* Product Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Size Selection */}
          {product.sizes && Object.keys(product.sizes).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.optionsContainer}>
                {Object.keys(product.sizes).length === 1 &&
                product.sizes["OS"] !== undefined ? (
                  // Only One Size (OS) available
                  <TouchableOpacity
                    key="OS"
                    style={[
                      styles.optionButton,
                      selectedSize === "OS" && styles.optionButtonSelected,
                      product.sizes["OS"] === 0 && styles.buttonDisabled,
                    ]}
                    onPress={() => setSelectedSize("OS")}
                    disabled={product.sizes["OS"] === 0}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedSize === "OS" && styles.optionTextSelected,
                        product.sizes["OS"] === 0 && {
                          color: Colors.mutedText,
                        },
                      ]}
                    >
                      OS {product.sizes["OS"] === 0 ? "(Agotado)" : ""}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // Multiple sizes (S, M, L, XL)
                  ["S", "M", "L", "XL"]
                    .filter((size) => product.sizes[size] !== undefined)
                    .map((size) => {
                      const qty = product.sizes[size] ?? 0;
                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.optionButton,
                            selectedSize === size &&
                              styles.optionButtonSelected,
                            qty === 0 && styles.buttonDisabled,
                          ]}
                          onPress={() => setSelectedSize(size)}
                          disabled={qty === 0}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selectedSize === size &&
                                styles.optionTextSelected,
                              qty === 0 && { color: Colors.mutedText },
                            ]}
                          >
                            {size} {qty === 0 ? "(Agotado)" : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                )}
              </View>
            </View>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Color</Text>
              <View style={styles.optionsContainer}>
                {product.colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.optionButton,
                      selectedColor === color && styles.optionButtonSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedColor === color && styles.optionTextSelected,
                      ]}
                    >
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={quantity <= 1 ? Colors.mutedText : Colors.darkText}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
                disabled={
                  !selectedSize ||
                  quantity >= (product.sizes[selectedSize] || 0)
                }
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={
                    !selectedSize ||
                    quantity >= (product.sizes[selectedSize] || 0)
                      ? Colors.mutedText
                      : Colors.darkText
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock Info */}
          {selectedSize && product.sizes && (
            <Text style={styles.stockText}>
              {product.sizes[selectedSize] > 0
                ? `${product.sizes[selectedSize]} items in stock for size ${selectedSize}`
                : `Out of stock for size ${selectedSize}`}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer: Total Price + Add to Cart Button */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>${totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (!selectedSize ||
              !product.sizes[selectedSize] ||
              product.sizes[selectedSize] === 0) &&
              styles.buttonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={
            !selectedSize ||
            !product.sizes[selectedSize] ||
            product.sizes[selectedSize] === 0
          }
        >
          <Ionicons name="cart-outline" size={24} color={Colors.whiteText} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightBackground },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: Colors.mutedText },
  errorText: { fontSize: 16, color: Colors.mutedText },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.whiteBackground,
  },
  backButton: { padding: 8 },
  wishlistButton: { padding: 8 },
  imageContainer: {
    width: "100%",
    height: 400,
    backgroundColor: Colors.whiteBackground,
  },
  productImage: { width: "100%", height: "100%" },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
  },
  placeholderText: { marginTop: 10, fontSize: 14, color: Colors.mutedText },
  contentContainer: { padding: 20 },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 8,
  },
  productGender: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.mainColor,
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.darkText,
    marginBottom: 12,
  },
  description: { fontSize: 15, lineHeight: 22, color: Colors.mutedText },
  optionsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.grayBorder,
    backgroundColor: Colors.whiteBackground,
  },
  optionButtonSelected: {
    borderColor: Colors.mainColor,
    backgroundColor: Colors.mainColor,
  },
  optionText: { fontSize: 14, fontWeight: "600", color: Colors.darkText },
  optionTextSelected: { color: Colors.whiteText },
  quantityContainer: { flexDirection: "row", alignItems: "center", gap: 20 },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.whiteBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.grayBorder,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.darkText,
    minWidth: 30,
    textAlign: "center",
  },
  stockText: { fontSize: 14, color: Colors.mutedText, marginTop: 8 },
  footer: {
    padding: 20,
    backgroundColor: Colors.whiteBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: { fontSize: 16, color: Colors.mutedText },
  totalPrice: { fontSize: 24, fontWeight: "bold", color: Colors.darkText },
  addToCartButton: {
    flexDirection: "row",
    backgroundColor: Colors.mainColor,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: Colors.mutedText, opacity: 0.5 },
  addToCartText: { fontSize: 18, fontWeight: "bold", color: Colors.whiteText },
});
