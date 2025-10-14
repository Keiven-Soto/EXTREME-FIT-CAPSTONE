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
import Colors from "../colors";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import ApiService from "../services/api";

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const USER_ID = 1; // TODO: hardcoded dummy ID for authentication

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const result = await ApiService.products.getById(productId);

      if (result.success) {
        const productData = result.data.data || result.data;
        setProduct(productData);

        // No seleccionar talla por defecto
        setSelectedSize(null);
        // Mantener color predeterminado si existe

        // Set default selections
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }

        // Check wishlist
        try {
          const wishlistCheck = await ApiService.wishlist.getById(
            USER_ID,
            productId
          );

          setIsWishlisted(
            Array.isArray(wishlistCheck.data) && wishlistCheck.data.length > 0
          );
        } catch (err) {
          console.error("Failed to fetch wishlist status", err);
          setIsWishlisted(false);
        }
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

  const handleAddToCart = async () => {
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
      const result = await ApiService.cart.addItem(USER_ID, product.product_id, quantity, selectedSize, selectedColor);
      if (result.success) {
        // Fetch cart to update data after adding item
        await ApiService.cart.get(USER_ID);
        Alert.alert('Added to Cart', `${product.name}\nSize: ${selectedSize}\nColor: ${selectedColor}\nQuantity: ${quantity}`);
      } else {
        Alert.alert('Error', result.error || 'Could not add to cart');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const handleWishlistToggle = async (productId) => {
    if (!isWishlisted) {
      console.log("Sent User ID and Product ID: ", USER_ID, ", ", productId);
      await ApiService.wishlist.add(USER_ID, productId);
      Alert.alert(
        "Added to Wishlist",
        `${product.name}\nSize: ${selectedSize}\nColor: ${selectedColor}\nQuantity: ${quantity}`,
        [{ text: "OK" }]
      );
      setIsWishlisted(true);
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
              // call API to remove and refresh list
              console.log(
                "Sent User ID and Product ID: ",
                USER_ID,
                product.product_id
              );
              await ApiService.wishlist.remove(USER_ID, product.product_id);
              setIsWishlisted(false);
            },
          },
        ]
      );
    }
  };

  // Nueva lógica: cantidad depende del stock de la talla seleccionada
  const incrementQuantity = () => {
    if (
      product?.sizes &&
      selectedSize &&
      quantity < (product.sizes[selectedSize] || 0)
    ) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

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

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageSource = product.cloudinary_public_id
    ? {
        uri: getCloudinaryImageUrl(product.cloudinary_public_id, {
          format: "auto",
        }),
      }
    : null;

  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleWishlistToggle(productId)}
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

        {/* Product Info */}
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

          {/* Description */}
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
                {Object.keys(product.sizes).length === 1 && product.sizes["OS"] !== undefined ? (
                  // Solo OS
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
                        product.sizes["OS"] === 0 && { color: Colors.mutedText },
                      ]}
                    >
                      OS {product.sizes["OS"] === 0 ? '(Agotado)' : ''}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // S, M, L, XL en orden si existen
                  ["S", "M", "L", "XL"].filter(size => product.sizes[size] !== undefined).map((size) => {
                    const qty = product.sizes[size] ?? 0;
                    return (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.optionButton,
                          selectedSize === size && styles.optionButtonSelected,
                          qty === 0 && styles.buttonDisabled,
                        ]}
                        onPress={() => setSelectedSize(size)}
                        disabled={qty === 0}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedSize === size && styles.optionTextSelected,
                            qty === 0 && { color: Colors.mutedText },
                          ]}
                        >
                          {size} {qty === 0 ? '(Agotado)' : ''}
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

          {/* Stock Info por talla */}
          {selectedSize && product.sizes && (
            <Text style={styles.stockText}>
              {product.sizes[selectedSize] > 0
                ? `${product.sizes[selectedSize]} items in stock for size ${selectedSize}`
                : `Out of stock for size ${selectedSize}`}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button - Fixed at bottom */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>${totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (
              !selectedSize ||
              !product.sizes[selectedSize] ||
              product.sizes[selectedSize] === 0
            ) && styles.buttonDisabled,
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
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.mutedText,
  },
  errorText: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.whiteBackground,
  },
  backButton: {
    padding: 8,
  },
  wishlistButton: {
    padding: 8,
  },
  imageContainer: {
    width: "100%",
    height: 400,
    backgroundColor: Colors.whiteBackground,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.mutedText,
  },
  contentContainer: {
    padding: 20,
  },
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.darkText,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.mutedText,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
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
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.darkText,
  },
  optionTextSelected: {
    color: Colors.whiteText,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
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
  stockText: {
    fontSize: 14,
    color: Colors.mutedText,
    marginTop: 8,
  },
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
  totalLabel: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.darkText,
  },
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
  buttonDisabled: {
    backgroundColor: Colors.mutedText,
    opacity: 0.5,
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.whiteText,
  },
});
