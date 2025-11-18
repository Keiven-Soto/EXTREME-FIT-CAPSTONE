import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, Image, ActivityIndicator, Linking } from 'react-native';
import { getCloudinaryImageUrl } from '../utils/cloudinary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '../colors';
import ApiService, { setGlobalAuthToken } from '../services/api';
import { useCurrentUser } from '../hooks/useAuthenticatedApi';

// Only import PayPal on native platforms
let PayPal = null;
if (Platform.OS !== 'web') {
  try {
    PayPal = require('react-native-paypal').PayPal;
  } catch (error) {
    console.log('PayPal not available on this platform');
  }
}

export default function BagScreen() {
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const [userId, setUserId] = useState(null);

  // Simulated payment
  const handleSimulatedPayment = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty. Add products before checking out.');
      return;
    }

    try {
      // 1. Find user's default address
      const addressResult = await ApiService.addresses.getByUser(userId);
      let defaultAddress = null;
      if (addressResult.success && Array.isArray(addressResult.data)) {
        defaultAddress = addressResult.data.find(addr => addr.is_default);
      }
      if (!defaultAddress) {
        Alert.alert('Error', 'You don\'t have a default shipping address. Please add one in your profile.');
        return;
      }

      // 2. Create order in backend with shipping_address_id
      const orderPayload = {
        user_id: userId,
        total_amount: subtotal + SHIPPING_COST,
        shipping_cost: SHIPPING_COST,
        payment_method: 'simulated',
        payment_status: 'paid',
        order_status: 'confirmed',
        shipping_address_id: defaultAddress.address_id,
      };
      const orderResult = await ApiService.orders.create(orderPayload);
      if (!orderResult || !orderResult.order_id) {
        Alert.alert('Error', 'Could not create order.');
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
          size: item.size || '',
          color: item.color || '',
        };
        const itemResult = await ApiService.orders.addOrderItem(orderId, itemPayload);
        if (!itemResult || !itemResult.order_item_id) {
          allItemsOk = false;
          break;
        }
      }
      if (!allItemsOk) {
        Alert.alert('Error', 'Could not save all products in the order.');
        return;
      }

      // 4. Clear cart in backend and frontend ALWAYS after payment
      await ApiService.cart.clear(userId);
      setCartItems([]);
      Alert.alert(
        'Payment Successful',
        'Simulated payment completed successfully!',
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.navigate('OrderDetails', { orderId });
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error in handleSimulatedPayment:', err);
      Alert.alert('Error', 'There was a problem processing the order.');
    }
  };
  
  // Stripe Checkout flow
  const handleStripeCheckout = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty. Add products before checking out.');
      return;
    }

    try {
      // 1. Find user's default address
      const addressResult = await ApiService.addresses.getByUser(userId);
      let defaultAddress = null;
      if (addressResult.success && Array.isArray(addressResult.data)) {
        defaultAddress = addressResult.data.find(addr => addr.is_default);
      }
      if (!defaultAddress) {
        Alert.alert('Error', 'You don\'t have a default shipping address. Please add one in your profile.');
        return;
      }

      // 2. Create order in backend with pending status
      const orderPayload = {
        user_id: userId,
        total_amount: subtotal + SHIPPING_COST,
        shipping_cost: SHIPPING_COST,
        payment_method: 'stripe',
        payment_status: 'pending',
        order_status: 'processing',
        shipping_address_id: defaultAddress.address_id,
      };
      const orderResult = await ApiService.orders.create(orderPayload);
      if (!orderResult || !orderResult.order_id) {
        Alert.alert('Error', 'Could not create order.');
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
          size: item.size || '',
          color: item.color || '',
        };
        const itemResult = await ApiService.orders.addOrderItem(orderId, itemPayload);
        if (!itemResult || !itemResult.order_item_id) {
          allItemsOk = false;
          break;
        }
      }
      if (!allItemsOk) {
        Alert.alert('Error', 'Could not save all products in the order.');
        return;
      }

      navigation.navigate('Checkout', { orderId });

    } catch (err) {
      console.error('Error in handleStripeCheckout:', err);
      Alert.alert('Error', 'There was a problem creating the order.');
    }
  };

  // Import useNavigation and useFocusEffect
  const navigation = require('@react-navigation/native').useNavigation();
  const useFocusEffect = require('@react-navigation/native').useFocusEffect;
  const SHIPPING_COST = 15.00; // TODO: Adjust shipping cost as needed

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
          console.log('🎫 Setting global token in BagScreen:', !!token);
          setGlobalAuthToken(token);
          setTokenReady(true);
          
          // Then get user data
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            console.log('User ID obtained:', userData.user_id);
            setUserId(userData.user_id);
          } else {
            console.log('Could not get user_id');
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
    if (!userId) {
      console.log('No userId available, skipping cart fetch');
      return;
    }

    if (!tokenReady) {
      console.log('Token not ready yet, skipping cart fetch');
      return;
    }

    console.log('Fetching cart for userId:', userId);
    setLoadingItems(true);
    
    try {
      const result = await ApiService.cart.get(userId);
      console.log('Cart API result:', result);
      
      if (result.success) {
        // Wait half a second before showing items
        setTimeout(() => {
          const mappedItems = result.data.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image_url: item.cloudinary_public_id ? getCloudinaryImageUrl(item.cloudinary_public_id) : null,
          }));
          console.log('Cart items loaded:', mappedItems.length);
          setCartItems(mappedItems);
          setLoadingItems(false);
        }, 500);
      } else {
        console.error('Error loading cart:', result.error);
        Alert.alert('Error', result.error || 'Could not load cart');
        setLoadingItems(false);
        setCartItems([]); // Set empty cart to avoid infinite loading
      }
    } catch (error) {
      console.error('Exception loading cart:', error);
      Alert.alert('Error', 'Could not load cart. Check your connection.');
      setLoadingItems(false);
      setCartItems([]); // Set empty cart to avoid infinite loading
    }
  };

  // Only fetch cart when BOTH userId AND token are ready
  useEffect(() => {
    if (userId && tokenReady) {
      fetchCart();
    }
  }, [userId, tokenReady]);

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
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + 1;
    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      await fetchCart();
    } else {
      Alert.alert('Error', result.error || 'Could not update quantity');
    }
  };

  const decrementQuantity = async (id) => {
    const item = cartItems.find(i => i.id === id);
    if (!item || item.quantity <= 1) return;
    const newQty = item.quantity - 1;
    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      await fetchCart();
    } else {
      Alert.alert('Error', result.error || 'Could not update quantity');
    }
  };

  // Remove product from cart and refresh
  const removeItem = async (id) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    const result = await ApiService.cart.removeItem(userId, id);
    if (result.success) {
      await fetchCart();
    } else {
      Alert.alert('Error', result.error || 'Could not remove product');
    }
  };

  // PayPal payment handler
  const handlePayPalPayment = () => {
    if (Platform.OS === 'web') {
      // For web platform, show a demo success message
      Alert.alert(
        'Demo Mode',
        'PayPal payment simulation completed successfully!\n\nNote: PayPal integration works on mobile devices. This is a demo for web.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear cart after successful payment
              setCartItems([]);
            }
          }
        ]
      );
      return;
    }

    if (!PayPal) {
      Alert.alert(
        'PayPal Unavailable',
        'PayPal payment is not available on this platform.',
        [{ text: 'OK' }]
      );
      return;
    }

    const paymentData = {
      amount: total.toFixed(2),
      currency: 'USD',
      description: `Extreme Fit - ${totalItems} items`,
      clientId: 'AX5LCRqe63mpn5Iuk5dD6Z6E32Qn6skf2MdRRGmtDDPQwvKMdx76rqjSbYgISFz8L5fuR_sFGHmFy7fh',
      environment: 'sandbox' // Use 'production' for live payments
    };

    PayPal.payWithPayPal(paymentData)
      .then((response) => {
        console.log('Payment successful:', response);
        Alert.alert(
          'Payment Successful!',
          `Transaction ID: ${response.response.id}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear cart after successful payment
                setCartItems([]);
              }
            }
          ]
        );
      })
      .catch((error) => {
        console.log('Payment error:', error);
        Alert.alert(
          'Payment Failed',
          'There was an error processing your payment. Please try again.',
          [{ text: 'OK' }]
        );
      });
  };

  const { subtotal, totalItems } = useMemo(() => {
    const sub = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal: sub, totalItems: count };
  }, [cartItems]);

  const total = subtotal + SHIPPING_COST;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bag</Text>
          <Text style={styles.headerSubtitle}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
        </View>

        <View style={styles.cartItems}>
          {loadingItems ? (
            <View style={styles.loadingItemsContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading cart...</Text>
            </View>
          ) : cartItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="cart-outline" size={64} color={Colors.mutedText} />
              <Text style={{ fontSize: 18, color: Colors.mutedText, marginTop: 16 }}>
                Your cart is empty
              </Text>
            </View>
          ) : (
            cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.productImageWrap}>
                  <View style={styles.productImageInner}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.productImageReal} />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="image-outline" size={20} color="#9ca3af" />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.productInfo}>
                  <View style={styles.namePriceRow}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.productDetails}>
                    {item.size ? `Size: ${item.size}` : ''}
                    {item.color ? `  Color: ${item.color}` : ''}
                  </Text>
                  <View style={styles.quantityControlsRow}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => decrementQuantity(item.id)}
                    >
                      <Ionicons name="remove" size={16} color={Colors.mainColor} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => incrementQuantity(item.id)}
                    >
                      <Ionicons name="add" size={16} color={Colors.mainColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Ionicons name="trash" size={18} color={Colors.errorColor || 'black'} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>${SHIPPING_COST.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={handleStripeCheckout}>
          <Text style={styles.checkoutButtonText}>Checkout with Stripe</Text>
          <Ionicons name="card-outline" size={20} color={Colors.whiteText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.testingcheckoutButton} onPress={handleSimulatedPayment}>
          <Text style={styles.checkoutButtonText}>Pay Now</Text>
          <Ionicons name="card-outline" size={20} color={Colors.whiteText} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  namePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loadingItemsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
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
  cartItem: {
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    position: 'relative',
    overflow: 'visible',
    backgroundColor: Colors.lightBackground,
    marginRight: 18,
  },
  productImageInner: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.lightBackground,
  },
  productImageReal: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.mainColor,
  },
  quantityControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: Colors.lightBackground,
    width: 50,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.errorColor || 'black',
    margin: 10,
  },
  quantityButton: {
    backgroundColor: Colors.lightBackground,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mainColor,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    minWidth: 20,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.mainColor,
  },
  checkoutButton: {
    backgroundColor: Colors.checkoutButton,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  testingcheckoutButton: {
    backgroundColor: 'black',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  checkoutButtonText: {
    color: Colors.whiteText,
    fontSize: 18,
    fontWeight: 'bold',
  },

});