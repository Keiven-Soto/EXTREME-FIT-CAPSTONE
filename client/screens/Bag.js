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
  Linking,
} from "react-native";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import Colors from "../colors";
import CornerLogo from "../components/CornerLogo";
import ApiService, { setGlobalAuthToken } from "../services/api";
import { useCurrentUser } from "../hooks/useAuthenticatedApi";
import emitter, { CART_UPDATED } from "../utils/events";

let PayPal = null;
if (Platform.OS !== "web") {
  try {
    PayPal = require("react-native-paypal").PayPal;
  } catch (error) {
    console.log("PayPal not available on this platform");
  }
}

export default function BagScreen() {
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const [userId, setUserId] = useState(null);

  // Simulated payment
  const handleSimulatedPayment = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert(
        "Error",
        "Your cart is empty. Add products before checking out."
      );
      return;
    }

    try {
      // 1. Find user's default address
      const addressResult = await ApiService.addresses.getByUser(userId);
      let defaultAddress = null;
      if (addressResult.success && Array.isArray(addressResult.data)) {
        defaultAddress = addressResult.data.find((addr) => addr.is_default);
      }
      if (!defaultAddress) {
        Alert.alert(
          "OH NO!",
          "You don't have a default shipping address. Please add one in your profile.",
          [
            { text: "Ok", style: "cancel" },
            {
              text: "Add Address",
              onPress: () => navigation.navigate("EditAddress"),
            },
          ]
        );
        return;
      }

      // 2. Create order in backend with shipping_address_id
      const orderPayload = {
        user_id: userId,
        total_amount: subtotal + SHIPPING_COST + taxes,
        shipping_cost: SHIPPING_COST,
        payment_method: "simulated",
        payment_status: "paid",
        order_status: "confirmed",
        shipping_address_id: defaultAddress.address_id,
      };
      const orderResult = await ApiService.orders.create(orderPayload);
      if (!orderResult || !orderResult.order_id) {
        Alert.alert("Error", "Could not create order.");
        return;
      }
      const orderId = orderResult.order_id;
      // 3. For each cart item: decrement stock by size, then create order item.
      //    If any stock adjustment or order item creation fails we rollback previous
      //    stock adjustments (increment back) and abort.
      const adjusted = []; // keep track of successful adjustments to rollback if needed
      let allItemsOk = true;
      for (const item of cartItems) {
        // attempt to decrement stock for this product/size
        try {
          const adjustRes = await ApiService.products.adjustStock(item.id, {
            size: item.size || "",
            quantity: item.quantity,
            operation: "decrement",
          });

          if (!adjustRes || !adjustRes.success) {
            // adjustment failed (e.g. insufficient stock)
            allItemsOk = false;
            const message =
              adjustRes && adjustRes.error
                ? adjustRes.error
                : "Failed to adjust stock";
            Alert.alert("Error", message);
            break;
          }

          // record successful adjustment for potential rollback
          adjusted.push({
            productId: item.id,
            size: item.size || "",
            quantity: item.quantity,
          });
        } catch (err) {
          allItemsOk = false;
          Alert.alert("Error", "Failed to adjust stock for a product.");
          break;
        }

        // create the order item after stock was reserved
        const itemPayload = {
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          size: item.size || "",
          color: item.color || "",
        };
        const itemResult = await ApiService.orders.addOrderItem(
          orderId,
          itemPayload
        );
        if (!itemResult || !itemResult.order_item_id) {
          allItemsOk = false;
          Alert.alert("Error", "Could not save a product in the order.");
          break;
        }
      }

      if (!allItemsOk) {
        // rollback any successful adjustments by incrementing back
        for (const a of adjusted) {
          try {
            await ApiService.products.adjustStock(a.productId, {
              size: a.size,
              quantity: a.quantity,
              operation: "increment",
            });
          } catch (e) {
            console.error("Rollback failed for", a, e);
          }
        }
        return;
      }

      // 4. Clear cart in backend and frontend ALWAYS after payment
      await ApiService.cart.clear(userId);
      setCartItems([]);
      Alert.alert(
        "Payment Successful",
        "Simulated payment completed successfully!",
        [
          {
            text: "View Order",
            onPress: () => {
              navigation.navigate("OrderDetails", { orderId });
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error in handleSimulatedPayment:", err);
      Alert.alert("Error", "There was a problem processing the order.");
    }
  };

  // Stripe Checkout flow
  const handleStripeCheckout = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert(
        "Error",
        "Your cart is empty. Add products before checking out."
      );
      return;
    }

    try {
      // 1. Find user's default address
      const addressResult = await ApiService.addresses.getByUser(userId);
      let defaultAddress = null;
      if (addressResult.success && Array.isArray(addressResult.data)) {
        defaultAddress = addressResult.data.find((addr) => addr.is_default);
      }
      if (!defaultAddress) {
        Alert.alert(
          "OH NO!",
          "You don't have a default shipping address. Please add one in your profile.",
          [
            { text: "Ok", style: "cancel" },
            {
              text: "Add Address",
              onPress: () => navigation.navigate("EditAddress"),
            },
          ]
        );
        return;
      }

      // 2. Create order in backend with pending status
      const orderPayload = {
        user_id: userId,
        total_amount: subtotal + SHIPPING_COST + taxes,
        shipping_cost: SHIPPING_COST,
        payment_method: "stripe",
        payment_status: "pending",
        order_status: "processing",
        shipping_address_id: defaultAddress.address_id,
      };
      const orderResult = await ApiService.orders.create(orderPayload);
      if (!orderResult || !orderResult.order_id) {
        Alert.alert("Error", "Could not create order.");
        return;
      }
      const orderId = orderResult.order_id;

      // 3. Create order items
      let allItemsOk = true;
      for (const item of cartItems) {
        const itemPayload = {
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          size: item.size || "",
          color: item.color || "",
        };
        const itemResult = await ApiService.orders.addOrderItem(
          orderId,
          itemPayload
        );
        if (!itemResult || !itemResult.order_item_id) {
          allItemsOk = false;
          break;
        }
      }
      if (!allItemsOk) {
        Alert.alert("Error", "Could not save all products in the order.");
        return;
      }

      // 4. Adjust stock for each cart item (decrement inventory)
      const adjusted = [];
      let stockAdjustmentOk = true;
      for (const item of cartItems) {
        try {
          const adjustRes = await ApiService.products.adjustStock(item.id, {
            size: item.size || "",
            quantity: item.quantity,
            operation: "decrement",
          });

          if (!adjustRes || !adjustRes.success) {
            stockAdjustmentOk = false;
            const message =
              adjustRes && adjustRes.error
                ? adjustRes.error
                : "Failed to adjust stock";
            Alert.alert("Error", message);
            break;
          }

          adjusted.push({
            productId: item.id,
            size: item.size || "",
            quantity: item.quantity,
          });
        } catch (err) {
          stockAdjustmentOk = false;
          Alert.alert("Error", "Failed to adjust stock for a product.");
          break;
        }
      }

      if (!stockAdjustmentOk) {
        // Rollback any successful stock adjustments
        for (const a of adjusted) {
          try {
            await ApiService.products.adjustStock(a.productId, {
              size: a.size,
              quantity: a.quantity,
              operation: "increment",
            });
          } catch (e) {
            console.error("Rollback failed for", a, e);
          }
        }
        Alert.alert("Error", "Could not reserve inventory. Please try again.");
        return;
      }

      // 5. Create Stripe Checkout Session
      console.log('Creating Stripe checkout session for order:', orderId);
      const checkoutResult = await ApiService.payments.createCheckoutSession(
        orderId,
        'extremefit://order-success',
        'extremefit://checkout'
      );

      if (!checkoutResult.success || !checkoutResult.data.url) {
        Alert.alert('Error', checkoutResult.error || 'Failed to create checkout session');
        // Rollback stock adjustments if Stripe session creation fails
        for (const a of adjusted) {
          try {
            await ApiService.products.adjustStock(a.productId, {
              size: a.size,
              quantity: a.quantity,
              operation: "increment",
            });
          } catch (e) {
            console.error("Rollback failed for", a, e);
          }
        }
        return;
      }

      console.log('Stripe checkout URL:', checkoutResult.data.url);

      // 6. Open Stripe Checkout in browser
      const stripeUrl = checkoutResult.data.url;
      const canOpen = await Linking.canOpenURL(stripeUrl);

      if (canOpen) {
        await Linking.openURL(stripeUrl);
        // It was implemented in OrderSuccessScreen.js to handle post-payment actions
        // 7. Clear cart after opening Stripe (will be cleared in backend after payment)
        ApiService.cart.clear(userId).catch((err) => console.error('Failed to clear cart (stripe):', err));
        setCartItems([]);

        // 8. Navigate to success screen (user will return here after payment)
        setTimeout(() => {
          navigation.navigate('OrderSuccess', { orderId });
        }, 1000);
      } else {
        Alert.alert('Error', 'Unable to open Stripe checkout page');
        // Rollback stock adjustments if unable to open Stripe
        for (const a of adjusted) {
          try {
            await ApiService.products.adjustStock(a.productId, {
              size: a.size,
              quantity: a.quantity,
              operation: "increment",
            });
          } catch (e) {
            console.error("Rollback failed for", a, e);
          }
        }
      }

    } catch (err) {
      console.error("Error in handleStripeCheckout:", err);
      Alert.alert("Error", "There was a problem creating the order.");
    }
  };

  // Import useNavigation and useFocusEffect
  const navigation = require("@react-navigation/native").useNavigation();
  const useFocusEffect = require("@react-navigation/native").useFocusEffect;
  const SHIPPING_COST = 15.0; // TODO: Adjust shipping cost as needed
  const TAX_RATE = 0.115; // 11.5% IVU-like tax rate

  const [cartItems, setCartItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  // Fetch authenticated user's database ID AND set the global token
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (isSignedIn) {
        try {
          // CRITICAL: Get and set the token FIRST
          const token = await getToken();
          console.log("🎫 Setting global token in BagScreen:", !!token);
          setGlobalAuthToken(token);
          setTokenReady(true);

          // Then get user data
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            console.log("User ID obtained:", userData.user_id);
            setUserId(userData.user_id);
          } else {
            console.log("Could not get user_id");
          }
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [isSignedIn]);

  // Function to get cart from backend
  const fetchCart = async () => {
    // Validate prerequisites
    if (!userId) {
      console.log("⏸️ No userId available, skipping cart fetch");
      return;
    }

    if (!tokenReady) {
      console.log("⏸️ Token not ready yet, skipping cart fetch");
      return;
    }

    console.log("🔄 fetchCart: Starting to fetch cart for userId:", userId);
    setLoadingItems(true);

    try {
      const result = await ApiService.cart.get(userId);
      console.log("📦 fetchCart: Received result:", result);

      // Validate result exists
      if (!result) {
        console.error("❌ fetchCart: No result returned from API");
        Alert.alert("Error", "Failed to load cart - no response from server");
        setLoadingItems(false);
        setCartItems([]);
        return;
      }

      if (result.success) {
        // Validate data is an array
        if (!Array.isArray(result.data)) {
          console.error(
            "❌ fetchCart: Invalid data format (not an array):",
            result.data
          );
          Alert.alert("Error", "Invalid cart data received from server");
          setLoadingItems(false);
          setCartItems([]);
          return;
        }

        console.log(
          `✅ fetchCart: Successfully loaded ${result.data.length} cart items`
        );

        // Map the data to frontend format
        const mappedItems = result.data.map((item) => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image_url: item.cloudinary_public_id
            ? getCloudinaryImageUrl(item.cloudinary_public_id)
            : null,
        }));

        setCartItems(mappedItems);
        setLoadingItems(false);
      } else {
        // Handle authentication errors specifically
        if (result.status === 401) {
          console.error("❌ fetchCart: Authentication error");
          Alert.alert(
            "Session Expired",
            "Please sign in again to view your cart"
          );
          setLoadingItems(false);
          setCartItems([]);
          return;
        }

        // Other errors
        const errorMessage = result.error || "Could not load cart";
        console.error("❌ fetchCart: API returned error:", errorMessage);

        // Don't show alert for empty cart (valid state)
        if (
          !errorMessage.includes("empty") &&
          !errorMessage.includes("no items")
        ) {
          Alert.alert("Error", errorMessage);
        }

        setLoadingItems(false);
        setCartItems([]);
      }
    } catch (error) {
      console.error("❌ fetchCart: Exception occurred:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        userId,
      });

      // Provide more specific error messages
      let errorMessage = "Could not load cart. Check your connection.";
      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
      setLoadingItems(false);
      setCartItems([]);
    } finally {
      console.log("🏁 fetchCart: Completed");
    }
  };

  // Refresh cart every time the screen receives focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId && tokenReady) {
        fetchCart();
      }
    }, [userId, tokenReady])
  );

  // Update quantity in backend and refresh cart
  const incrementQuantity = async (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = item.quantity + 1;
    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      await fetchCart();
      emitter.emit(CART_UPDATED);
    } else {
      Alert.alert("Error", result.error || "Could not update quantity");
    }
  };

  const decrementQuantity = async (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item || item.quantity <= 1) return;
    const newQty = item.quantity - 1;
    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      await fetchCart();
      emitter.emit(CART_UPDATED);
    } else {
      Alert.alert("Error", result.error || "Could not update quantity");
    }
  };

  // Remove product from cart and refresh
  const removeItem = async (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const result = await ApiService.cart.removeItem(userId, id);
    if (result.success) {
      await fetchCart();
      emitter.emit(CART_UPDATED);
    } else {
      Alert.alert("Error", result.error || "Could not remove product");
    }
  };

  // Navigate to product details from bag
  const goToProduct = (productId) => {
    navigation.navigate("ProductDetails", {
      productId,
      isFromCart: true,
    });
  };

  // PayPal payment handler
  const handlePayPalPayment = () => {
    if (Platform.OS === "web") {
      // For web platform, show a demo success message
      Alert.alert(
        "Demo Mode",
        "PayPal payment simulation completed successfully!\n\nNote: PayPal integration works on mobile devices. This is a demo for web.",
        [
          {
            text: "OK",
            onPress: () => {
              // Clear cart after successful payment
              setCartItems([]);
            },
          },
        ]
      );
      return;
    }

    if (!PayPal) {
      Alert.alert(
        "PayPal Unavailable",
        "PayPal payment is not available on this platform.",
        [{ text: "OK" }]
      );
      return;
    }

    const paymentData = {
      amount: total.toFixed(2),
      currency: "USD",
      description: `Extreme Fit - ${totalItems} items`,
      clientId:
        "AX5LCRqe63mpn5Iuk5dD6Z6E32Qn6skf2MdRRGmtDDPQwvKMdx76rqjSbYgISFz8L5fuR_sFGHmFy7fh",
      environment: "sandbox", // Use 'production' for live payments
    };

    PayPal.payWithPayPal(paymentData)
      .then((response) => {
        console.log("Payment successful:", response);
        Alert.alert(
          "Payment Successful!",
          `Transaction ID: ${response.response.id}`,
          [
            {
              text: "OK",
              onPress: () => {
                // Clear cart after successful payment
                setCartItems([]);
              },
            },
          ]
        );
      })
      .catch((error) => {
        console.log("Payment error:", error);
        Alert.alert(
          "Payment Failed",
          "There was an error processing your payment. Please try again.",
          [{ text: "OK" }]
        );
      });
  };

  const { subtotal, totalItems } = useMemo(() => {
    const sub = cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal: sub, totalItems: count };
  }, [cartItems]);

  const taxes = +(subtotal * TAX_RATE).toFixed(2);
  const total = subtotal + SHIPPING_COST + taxes;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

        <View style={styles.header}>
          <View style={styles.headerIconRow}>
            <Ionicons name="cart" size={30} color="black" />
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>

          <Text style={styles.headerSubtitle}>{totalItems} items</Text>
        </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 40 }}  // separación debajo del header
      >
        <View style={styles.cartItems}>
          {loadingItems ? (
            <View style={styles.loadingItemsContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading cart...</Text>
            </View>
          ) : cartItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Ionicons
                name="cart-outline"
                size={64}
                color={Colors.mutedText}
              />
              <Text
                style={{ fontSize: 18, color: Colors.mutedText, marginTop: 16 }}
              >
                Your cart is empty
              </Text>
            </View>
          ) : (
            cartItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cartItem}
                activeOpacity={0.8}
                onPress={() => goToProduct(item.id)}
              >
                <View style={styles.productImageWrap}>
                  <View style={styles.productImageInner}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.productImageReal}
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons
                          name="image-outline"
                          size={20}
                          color="#9ca3af"
                        />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.productInfo}>
                  {/* Card Header: only product name */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color={Colors.whiteText}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Body: removed product details */}
                  <Text style={styles.productDetails}>
                    {item.size ? `Size: ${item.size}` : ""}
                    {item.color ? `  Color: ${item.color}` : ""}
                  </Text>

                  {/* Card Footer: price and quantity */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.productPrice}>
                      ${Number(item.price).toFixed(2)}
                    </Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        onPress={() => decrementQuantity(item.id)}
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={Colors.whiteText}
                        />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => incrementQuantity(item.id)}
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={Colors.whiteText}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>${SHIPPING_COST.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${taxes.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleStripeCheckout}
        >
          <Text style={styles.checkoutButtonText}>Checkout with Stripe</Text>
          <Ionicons name="card-outline" size={20} color={Colors.whiteText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.testingcheckoutButton}
          onPress={handleSimulatedPayment}
        >
          <Text style={styles.checkoutButtonText}>Pay Now</Text>
          <Ionicons name="card-outline" size={20} color={Colors.whiteText} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <CornerLogo />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  namePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  loadingItemsContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.mutedText,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  header: {
    padding: 10,
    paddingTop: 20,
    alignItems: "center",     
    justifyContent: "center",  
  },
  headerIconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "left",
    color: Colors.darkText,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  cartItems: {
    paddingHorizontal: 20,
  },
  // cartItem: {
  //   backgroundColor: Colors.whiteBackground,
  //   borderRadius: 12,
  //   padding: 10,
  //   marginBottom: 15,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   shadowColor: Colors.shadowColor,
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 8,
  //   elevation: 3,
  // },
  cartItem: {
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    padding: 12, // slightly more padding for breathing room
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 16,
    position: "relative",
    overflow: "visible",
    backgroundColor: Colors.lightBackground,
    marginRight: 18,
  },
  productImageInner: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.lightBackground,
  },
  productImageReal: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // productInfo: {
  //   flex: 1,
  // },
  productInfo: {
    flex: 1,
    justifyContent: "space-between", // spreads header and footer
  },
  // cardHeader: {
  //   flex: 1,
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  // },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.darkText,
  },
  deleteButton: {
    // padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",      // ← solid black
    marginLeft: "auto",

  },
  productDetails: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  productPrice: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.mainColor,
  },
  // cardFooter: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  // },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4, // small spacing below header
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8, // small spacing from header
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.mainColor,
    backgroundColor: Colors.mainColor,
    width: 90,
  },
  quantityButton: {
    backgroundColor: Colors.lightBackground,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.mainColor,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.whiteText,
    minWidth: 20,
    textAlign: "center",
  },
  summary: {
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 15,
    borderBottomColor: Colors.lightBorder,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "medium",
    color: Colors.darkText,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightBorder,
    paddingTop: 10,
    marginTop: 10,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.darkText,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.mainColor,
  },
  checkoutButton: {
    backgroundColor: Colors.checkoutButton,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    padding: 18,
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  testingcheckoutButton: {
    backgroundColor: "black",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  checkoutButtonText: {
    color: Colors.whiteText,
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
});
