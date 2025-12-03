// BagScreen.js
import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import Colors from "../colors";
import ApiService, { setGlobalAuthToken } from "../services/api";
import { useCurrentUser } from "../hooks/useAuthenticatedApi";
import { getCloudinaryImageUrl } from "../utils/cloudinary";

// React-Native safe EventEmitter
import { EventEmitter } from "fbemitter";
export const cartEvents = new EventEmitter();

export default function BagScreen() {
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const navigation = require("@react-navigation/native").useNavigation();
  const useFocusEffect = require("@react-navigation/native").useFocusEffect;

  const [userId, setUserId] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const SHIPPING_COST = 15.0;

  // -----------------------------
  //  AUTH + TOKEN SETUP
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) return;

      const token = await getToken();
      setGlobalAuthToken(token);
      setTokenReady(true);

      const user = await getCurrentUser();
      setUserId(user?.user_id);
    };
    init();
  }, [isSignedIn]);

  // -----------------------------
  //  FETCH CART ITEMS
  // -----------------------------
  const fetchCart = async () => {
    if (!userId || !tokenReady) return;

    setLoadingItems(true);
    try {
      const result = await ApiService.cart.get(userId);

      if (result?.success && Array.isArray(result.data)) {
        const mapped = result.data.map((item) => ({
          id: item.product_id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          size: item.size,
          color: item.color,
          image_url: item.cloudinary_public_id
            ? getCloudinaryImageUrl(item.cloudinary_public_id)
            : null,
        }));

        setCartItems(mapped);
      } else {
        setCartItems([]);
      }
    } catch (e) {
      console.log("Cart fetch failed:", e);
    }
    setLoadingItems(false);
  };

  // Refresh cart when screen focused
  useFocusEffect(
    React.useCallback(() => {
      if (userId && tokenReady) {
        fetchCart();
        cartEvents.emit("cartUpdated");
      }
    }, [userId, tokenReady])
  );

  // -----------------------------
  //  QUANTITY CONTROLS
  // -----------------------------
  const incrementQuantity = async (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const newQty = item.quantity + 1;

    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      setCartItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity: newQty } : p))
      );
      cartEvents.emit("cartUpdated");
      fetchCart();
    }
  };

  const decrementQuantity = async (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || item.quantity <= 1) return;

    const newQty = item.quantity - 1;

    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      setCartItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity: newQty } : p))
      );
      cartEvents.emit("cartUpdated");
      fetchCart();
    }
  };

  const removeItem = async (id) => {
    const result = await ApiService.cart.removeItem(userId, id);
    if (result.success) {
      fetchCart();
      cartEvents.emit("cartUpdated");
    }
  };

  const goToProduct = (productId) => {
    navigation.navigate("ProductDetails", { productId, isFromCart: true });
  };

  // -----------------------------
  //  TOTALS
  // -----------------------------
  const { subtotal, totalItems } = useMemo(() => {
    const sub = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const count = cartItems.reduce((s, i) => s + i.quantity, 0);
    return { subtotal: sub, totalItems: count };
  }, [cartItems]);

  const total = subtotal + SHIPPING_COST;

  // -----------------------------
  //  RENDER UI
  // -----------------------------
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIconRow}>
            <Ionicons name="cart" size={30} color="black" />
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>
          <Text style={styles.headerSubtitle}>{totalItems} items</Text>
        </View>

        {/* CART ITEMS */}
        <View style={styles.cartItems}>
          {loadingItems ? (
            <View style={styles.loadingItemsContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading cart...</Text>
            </View>
          ) : cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={80} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Add items to get started
              </Text>

              <TouchableOpacity
                style={styles.startShoppingButton}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.startShoppingText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cartItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cartItem}
                onPress={() => goToProduct(item.id)}
              >
                <View style={styles.productImageWrap}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.productImageReal}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="image-outline" size={20} color="#9ca3af" />
                    </View>
                  )}
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>
                    ${item.price.toFixed(2)}
                  </Text>

                  <Text style={styles.productDetails}>
                    {item.size ? `Size: ${item.size}  ` : ""}
                    {item.color ? `Color: ${item.color}` : ""}
                  </Text>

                  <View style={styles.quantityControlsRow}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => decrementQuantity(item.id)}
                    >
                      <Ionicons name="remove" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.quantityValue}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => incrementQuantity(item.id)}
                    >
                      <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>

                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* SUMMARY */}
        {cartItems.length > 0 && (
          <>
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping:</Text>
                <Text style={styles.summaryValue}>
                  ${SHIPPING_COST.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {/* CHECKOUT BUTTONS */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => navigation.navigate("Checkout", { total })}
            >
              <Text style={styles.checkoutButtonText}>
                Checkout with Stripe
              </Text>
              <Ionicons name="card-outline" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testingcheckoutButton}
              onPress={() => Alert.alert("Simulated Payment")}
            >
              <Text style={styles.checkoutButtonText}>Pay Now</Text>
              <Ionicons name="card-outline" size={20} color="white" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------------------
   CLEAN, MODERN STYLING
--------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },

  header: {
    paddingTop: 20,
    paddingBottom: 25,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerIconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "black",
  },
  headerSubtitle: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 15,
    color: "#7d7d7d",
  },

  cartItems: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  cartItem: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
    marginBottom: 22,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  productImageWrap: {
    width: 95,
    height: 95,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginRight: 18,
  },
  productImageReal: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
  productPrice: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
  },
  productDetails: {
    marginTop: 4,
    fontSize: 14,
    color: "#7d7d7d",
  },

  quantityControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 16,
  },

  qtyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",      // ← solid black
  },

  quantityValue: {
    fontSize: 17,
    fontWeight: "700",
    minWidth: 26,
    textAlign: "center",
    color: "black",
  },

  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",      // ← solid black
    marginLeft: "auto",
  },

  summary: {
    backgroundColor: "white",
    marginHorizontal: 18,
    marginVertical: 28,
    padding: 22,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#7d7d7d",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 14,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "black",
  },

  checkoutButton: {
    backgroundColor: "black",
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  testingcheckoutButton: {
    backgroundColor: "black",
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
  },

  checkoutButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "white",
  },

  emptyContainer: {
    padding: 80,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#7d7d7d",
    marginTop: 6,
  },
  startShoppingButton: {
    backgroundColor: "black",
    marginTop: 25,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },
  startShoppingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  loadingItemsContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7d7d7d",
  },
});
