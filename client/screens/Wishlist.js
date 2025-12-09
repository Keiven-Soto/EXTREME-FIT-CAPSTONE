import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '../colors';
import CornerLogo from '../components/CornerLogo';
import {ProductDetailScreen} from '../screens/productDetails';
import ApiService, { setGlobalAuthToken } from '../services/api';
import { useCurrentUser } from '../hooks/useAuthenticatedApi';
import { getCloudinaryImageUrl } from '../utils/cloudinary';

export default function WishlistScreen({ navigation }) {
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const useFocusEffect = require("@react-navigation/native").useFocusEffect;
  
  console.log("🎬 WishlistScreen mounted/rendered");
  
  const [userId, setUserId] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  // Size/Color selection modal state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const lastFetchRef = useRef(0);

  // Fetch authenticated user's database ID AND set the global token
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (isSignedIn) {
        try {
          // Get and set the token FIRST
          const token = await getToken();
          console.log("🎫 Setting global token in WishlistScreen:", !!token);
          setGlobalAuthToken(token);
          setTokenReady(true);

          // Then get user data
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            console.log("✅ User ID obtained:", userData.user_id);
            setUserId(userData.user_id);
          } else {
            console.log("❌ Could not get user_id");
          }
        } catch (error) {
          console.error("❌ Error fetching user ID:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [isSignedIn]);

  // Fetch wishlist from backend
  const fetchWishlist = async () => {
    if (!userId) {
      console.log("No userId available, skipping wishlist fetch");
      return;
    }

    if (!tokenReady) {
      console.log("Token not ready yet, skipping wishlist fetch");
      return;
    }

    // Prevent duplicate/rapid consecutive fetches (e.g., useEffect + useFocusEffect)
    const now = Date.now();
    if (now - (lastFetchRef.current || 0) < 3000) {
      console.log('Skipping duplicate wishlist fetch (throttled)');
      return;
    }
    lastFetchRef.current = now;

    console.log("🛍️ Fetching wishlist for userId:", userId);
    console.log("📍 Stack:", new Error().stack?.split('\n').slice(0, 5).join('\n'));
    setLoading(true);

    try {
      const result = await ApiService.wishlist.get(userId);
      console.log("🛍️ Wishlist API result:", result);

      if (result.success) {
        // Fetch product details for each wishlist item
        const itemsWithDetails = await Promise.all(
          result.data.map(async (item) => {
            try {
              const productResult = await ApiService.products.getById(item.product_id);
              if (productResult.success) {
                const productData = productResult.data;

                // Parse sizes if it's a string
                let sizes = productData.sizes;
                if (typeof sizes === "string") {
                  try {
                    sizes = JSON.parse(sizes);
                  } catch (e) {
                    console.error("Error parsing sizes:", e);
                    sizes = {};
                  }
                }

                // Parse colors if it's a string
                let colors = productData.colors;
                if (typeof colors === "string") {
                  try {
                    colors = JSON.parse(colors);
                  } catch (e) {
                    console.error("Error parsing colors:", e);
                    colors = [];
                  }
                }

                return {
                  wishlist_id: item.wishlist_id,
                  product_id: item.product_id,
                  added_at: item.added_at,
                  ...productData,
                  sizes,
                  colors,
                };
              }
              return null;
            } catch (error) {
              console.error("Error fetching product details:", error);
              return null;
            }
          })
        );

        // Filter out null values
        const validItems = itemsWithDetails.filter((item) => item !== null);
        console.log("🛍️ Wishlist items loaded:", validItems.length);
        setWishlistItems(validItems);
      } else {
        const errorMsg = result.error || result.message || 'Unknown error loading wishlist';
        console.error("❌ Error loading wishlist:", errorMsg);

        // Handle authentication errors specifically
        if (result.status === 401) {
          Alert.alert(
            "Session Expired",
            "Please sign in again to view your wishlist"
          );
        } else if (errorMsg !== 'Unknown error loading wishlist') {
          // Only show alert for real errors (not empty wishlist)
          Alert.alert("Error", errorMsg);
        }
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("❌ Exception loading wishlist:", error);
      Alert.alert("Error", "Could not load wishlist. Please try again.");
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch wishlist when BOTH userId AND token are ready
  useEffect(() => {
    console.log(`📋 useEffect triggered: userId=${userId}, tokenReady=${tokenReady}`);
    if (userId && tokenReady) {
      fetchWishlist();
    }
  }, [userId, tokenReady]);

  // Refresh wishlist when screen receives focus
  useFocusEffect(
    React.useCallback(() => {
      console.log(`📱 useFocusEffect triggered: userId=${userId}, tokenReady=${tokenReady}`);
      if (userId && tokenReady) {
        fetchWishlist();
      }
    }, [userId, tokenReady])
  );

  const removeFromWishlist = async (productId) => {
    try {
      const result = await ApiService.wishlist.remove(userId, productId);
      if (result.success) {
        console.log("✅ Removed from wishlist");
        // Refresh wishlist
        await fetchWishlist();
      } else {
        Alert.alert("Error", result.error || "Could not remove from wishlist");
      }
    } catch (error) {
      console.error("❌ Error removing from wishlist:", error);
      Alert.alert("Error", "Could not remove from wishlist");
    }
  };

  const goToProduct = (productId) => {
    navigation.navigate("ProductDetails", {
      productId,
      isFromWishlist: true,
    });
  };

  // Open size selection modal
  const openSizeSelectionModal = (product) => {
    setSelectedProduct(product);
    setSelectedSize("");
    setSelectedColor("");
    setShowSizeModal(true);
  };

  // Close modal and reset selections
  const closeSizeModal = () => {
    setShowSizeModal(false);
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedColor("");
  };

  // Confirm and add to cart with selected size/color
  const confirmAddToCart = async () => {
    // Check if product has sizes defined
    const hasSizes = selectedProduct?.sizes && Object.keys(selectedProduct.sizes).length > 0;
    const hasColors = selectedProduct?.colors && selectedProduct.colors.length > 0;

    if (hasSizes && !selectedSize) {
      Alert.alert('Size Required', 'Please select a size before adding to cart');
      return;
    }

    if (hasColors && !selectedColor) {
      Alert.alert('Color Required', 'Please select a color before adding to cart');
      return;
    }

    try {
      // Add the item to the cart with selected size and color
      const cartResult = await ApiService.cart.addItem(
        userId,
        selectedProduct.product_id,
        1,
        selectedSize,
        selectedColor
      );

      console.log('confirmAddToCart: payload ->', {
        userId,
        product_id: selectedProduct?.product_id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
      });
      console.log('confirmAddToCart: cartResult ->', cartResult);

      if (cartResult.success) {
        // Remove from wishlist
        const wishlistResult = await ApiService.wishlist.remove(userId, selectedProduct.product_id);

        if (wishlistResult.success) {
          Alert.alert('Success!', `Item added to cart (Size: ${selectedSize}, Color: ${selectedColor})`);
          closeSizeModal();
          // Refresh the wishlist to show updated list
          await fetchWishlist();
        }
      } else {
        console.error('confirmAddToCart failed:', cartResult);
        // show more detailed error when available
        const serverMessage = cartResult && (cartResult.error || cartResult.message || JSON.stringify(cartResult));
        Alert.alert('Error', serverMessage || 'Could not add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Could not add to cart');
    }
  };

  // Add to cart and remove from wishlist
  const addToCart = async (product) => {
    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to add items to cart");
      return;
    }

    // Open modal for size/color selection
    openSizeSelectionModal(product);
  };

  const renderItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => goToProduct(item.product_id)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.cloudinary_public_id ? (
            <Image
              source={{ uri: getCloudinaryImageUrl(item.cloudinary_public_id) }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={Colors.mutedText} />
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
          
          {item.stock_quantity !== undefined && (
            <Text
              style={[
                styles.stockText,
                item.stock_quantity === 0 && styles.outOfStock,
              ]}
            >
              {item.stock_quantity === 0
                ? "Out of Stock"
                : item.stock_quantity < 10
                ? `Only ${item.stock_quantity} left`
                : "In Stock"}
            </Text>
          )}

          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={(e) => {
              e.stopPropagation();
              addToCart(item);
            }}
            disabled={item.stock_quantity === 0}
          >
            <Ionicons name="cart-outline" size={16} color={Colors.whiteText} />
            <Text style={styles.addToCartText}>
              {item.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            removeFromWishlist(item.product_id);
          }}
        >
          <Ionicons name="heart" size={24} color={Colors.errorColor || '#ef4444'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={Colors.mutedText} />
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>Save your favorite items here</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerIconRow}>
          <Text style={styles.headerTitle} >My Wishlist</Text>
          <Ionicons name="heart-sharp" size={28} color="black" />
        </View>
        <Text style={styles.headerSubtitle}>
          {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.mainColor} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.wishlist_id.toString()}
          contentContainerStyle={
            wishlistItems.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            wishlistItems.length > 0 && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => navigation.navigate("Shop")}
              >
                <Text style={styles.continueButtonText}>Continue Shopping</Text>
              </TouchableOpacity>
            )
          }
        />
      )}

              {/* Footer */}
              <View style={styles.footer}>
                <CornerLogo />
              </View>

      {/* Size and Color Selection Modal */}
      <Modal
        visible={showSizeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSizeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Size & Color</Text>
              <TouchableOpacity onPress={closeSizeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Info */}
              {selectedProduct && (
                <View style={styles.modalProductInfo}>
                  <Image
                    source={{ uri: getCloudinaryImageUrl(selectedProduct.cloudinary_public_id) }}
                    style={styles.modalProductImage}
                    resizeMode="cover"
                  />
                  <View style={styles.modalProductDetails}>
                    <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                    <Text style={styles.modalProductPrice}>
                      ${Number(selectedProduct.price).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Size Selection */}
              {selectedProduct?.sizes && Object.keys(selectedProduct.sizes).length > 0 && (
                <View style={styles.selectionSection}>
                  <Text style={styles.selectionLabel}>Size *</Text>
                  <View style={styles.optionsGrid}>
                    {Object.keys(selectedProduct.sizes).length === 1 && selectedProduct.sizes["OS"] !== undefined ? (
                      // One Size (OS) only
                      <TouchableOpacity
                        key="OS"
                        style={[
                          styles.optionButton,
                          selectedSize === "OS" && styles.optionButtonSelected,
                          selectedProduct.sizes["OS"] === 0 && styles.optionButtonDisabled,
                        ]}
                        onPress={() => setSelectedSize("OS")}
                        disabled={selectedProduct.sizes["OS"] === 0}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedSize === "OS" && styles.optionTextSelected,
                            selectedProduct.sizes["OS"] === 0 && styles.optionTextDisabled,
                          ]}
                        >
                          OS {selectedProduct.sizes["OS"] === 0 ? '(Out of Stock)' : ''}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      // Regular sizes (S, M, L, XL)
                      ["S", "M", "L", "XL"].filter(size => selectedProduct.sizes[size] !== undefined).map((size) => {
                        const qty = selectedProduct.sizes[size] ?? 0;
                        return (
                          <TouchableOpacity
                            key={size}
                            style={[
                              styles.optionButton,
                              selectedSize === size && styles.optionButtonSelected,
                              qty === 0 && styles.optionButtonDisabled,
                            ]}
                            onPress={() => setSelectedSize(size)}
                            disabled={qty === 0}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                selectedSize === size && styles.optionTextSelected,
                                qty === 0 && styles.optionTextDisabled,
                              ]}
                            >
                              {size} {qty === 0 ? '(Out of Stock)' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              )}

              {/* Color Selection */}
              {selectedProduct?.colors && selectedProduct.colors.length > 0 && (
                <View style={styles.selectionSection}>
                  <Text style={styles.selectionLabel}>Color *</Text>
                  <View style={styles.optionsGrid}>
                    {selectedProduct.colors.map((color) => (
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

              {/* Add to Cart Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (
                    (selectedProduct?.sizes && Object.keys(selectedProduct.sizes).length > 0 && !selectedSize) ||
                    (selectedProduct?.colors && selectedProduct.colors.length > 0 && !selectedColor)
                  ) && styles.confirmButtonDisabled,
                ]}
                onPress={confirmAddToCart}
                disabled={
                  (selectedProduct?.sizes && Object.keys(selectedProduct.sizes).length > 0 && !selectedSize) ||
                  (selectedProduct?.colors && selectedProduct.colors.length > 0 && !selectedColor)
                }
              >
                <Ionicons name="cart" size={20} color={Colors.whiteText} />
                <Text style={styles.confirmButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground || "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: Colors.lightBackground || "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground || "#e5e5e5",
  },
  headerIconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.darkText || "#000",
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: Colors.mutedText || "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.mutedText || "#666",
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.darkText || "#000",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.mutedText || "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: Colors.mainColor || "#000",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: Colors.whiteText || "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 15,
  },
  wishlistItem: {
    backgroundColor: Colors.whiteBackground || "#fff",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: Colors.shadowColor || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemContent: {
    flexDirection: "row",
    padding: 15,
  },
  imageContainer: {
    width: 100,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.lightBackground || "#f5f5f5",
    marginRight: 15,
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
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.darkText || "#000",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.mutedText || "#666",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.mainColor || "#000",
    marginBottom: 5,
  },
  stockText: {
    fontSize: 12,
    color: Colors.successColor || "#22c55e",
    marginBottom: 10,
  },
  outOfStock: {
    color: Colors.errorColor || "#ef4444",
  },
  addToCartButton: {
    flexDirection: "row",
    backgroundColor: Colors.mainColor || "#000",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  addToCartText: {
    color: Colors.whiteText || "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 8,
    right: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.whiteBackground || "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder || "#e5e5e5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.darkText || "#000",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalProductInfo: {
    flexDirection: "row",
    marginBottom: 25,
    padding: 15,
    backgroundColor: Colors.lightBackground || "#f5f5f5",
    borderRadius: 12,
  },
  modalProductImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  modalProductDetails: {
    flex: 1,
    justifyContent: "center",
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.darkText || "#000",
    marginBottom: 8,
  },
  modalProductPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.mainColor || "#000",
  },
  selectionSection: {
    marginBottom: 25,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.darkText || "#000",
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.lightBorder || "#e5e5e5",
    backgroundColor: Colors.whiteBackground || "#fff",
    minWidth: 70,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: Colors.mainColor || "#000",
    borderColor: Colors.mainColor || "#000",
  },
  optionButtonDisabled: {
    backgroundColor: Colors.lightBackground || "#f5f5f5",
    borderColor: Colors.lightBorder || "#e5e5e5",
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.darkText || "#000",
  },
  optionTextSelected: {
    color: Colors.whiteText || "#fff",
  },
  optionTextDisabled: {
    color: Colors.mutedText || "#999",
  },
  confirmButton: {
    flexDirection: "row",
    backgroundColor: Colors.mainColor || "#000",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.mutedText || "#999",
    opacity: 0.5,
  },
  confirmButtonText: {
    color: Colors.whiteText || "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: Colors.mainColor || "#000",
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 25,
  },
  continueButtonText: {
    color: Colors.whiteText || "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
});
