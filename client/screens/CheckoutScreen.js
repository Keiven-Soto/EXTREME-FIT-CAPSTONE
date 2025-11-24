import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useStripe } from '@stripe/stripe-react-native';
import Colors from '../colors';
import ApiService from '../services/api';
import { useCurrentUser } from '../hooks/useAuthenticatedApi';

export default function CheckoutScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [userId, setUserId] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      initializeAuth();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (orderId && userId) {
      fetchOrderDetails();
    }
  }, [orderId, userId]);

  const initializeAuth = async () => {
    try {
      const user = await getCurrentUser();
      console.log('👤 User loaded:', user?.user_id);
      if (user?.user_id) {
        setUserId(user.user_id);
      }
    } catch (error) {
      console.error('❌ Failed to get user:', error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching order:', orderId);
      const result = await ApiService.orders.getById(orderId);
      
      if (result.success) {
        console.log('✅ Order loaded:', result.data);
        setOrder(result.data);
        // Initialize payment sheet after order is loaded
        await initializePaymentSheet(orderId);
      } else {
        console.error('❌ Failed to load order:', result.error);
        Alert.alert('Error', 'Failed to load order details');
      }
    } catch (error) {
      console.error('❌ Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentSheet = async (orderIdParam) => {
    try {
      setLoading(true);
      console.log('💳 Initializing payment sheet for order:', orderIdParam);

      // Create PaymentIntent on backend
      const result = await ApiService.payments.createPaymentIntent(orderIdParam);
      
      console.log('🔍 Payment Intent Result:', result);

      if (!result.success || !result.data?.paymentIntent) {
        console.error('❌ Payment intent creation failed:', result);
        Alert.alert('Error', result.error || 'Failed to initialize payment');
        return;
      }

      const { paymentIntent, publishableKey } = result.data;
      console.log('✅ Got client secret:', paymentIntent ? 'YES' : 'NO');
      console.log('✅ Got publishable key:', publishableKey ? 'YES' : 'NO');

      // Initialize the payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'ExtremeFit',
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: {
          name: order?.first_name && order?.last_name 
            ? `${order.first_name} ${order.last_name}` 
            : undefined,
          email: order?.email || undefined,
        },
        // Enable Apple Pay and Google Pay
        // applePay: {
        //   merchantCountryCode: 'US',
        // },
        // googlePay: {
        //   merchantCountryCode: 'US',
        //   testEnv: __DEV__, // Use test environment in development
        //   currencyCode: 'USD',
        // },
        // Customize appearance
        appearance: {
          colors: {
            primary: Colors.primary || '#007AFF',
          },
        },
        returnURL: 'extremefit://checkout',
      });

      if (error) {
        console.error('❌ Payment sheet initialization error:', error);
        Alert.alert('Error', `Failed to initialize payment: ${error.message}`);
      } else {
        console.log('✅ Payment sheet initialized successfully');
        setPaymentReady(true);
      }
    } catch (error) {
      console.error('❌ Error initializing payment sheet:', error);
      Alert.alert('Error', `Failed to initialize payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    console.log('💰 Pay button pressed');
    console.log('Payment ready:', paymentReady);
    
    if (!paymentReady) {
      Alert.alert('Error', 'Payment not ready. Please wait...');
      return;
    }

    try {
      setLoading(true);
      console.log('📱 Presenting payment sheet...');

      // Present the payment sheet
      const { error } = await presentPaymentSheet();

      console.log('Payment sheet result:', { error: error?.message });

      if (error) {
        // User cancelled or error occurred
        if (error.code === 'Canceled') {
          console.log('👤 Payment cancelled by user');
        } else {
          console.error('❌ Payment failed:', error);
          Alert.alert('Payment Failed', error.message);
        }
      } else {
        // Payment succeeded!
        console.log('✅ Payment succeeded!');

        // Clear cart in backend after successful payment (same as Pay Now button)
        try {
          await ApiService.cart.clear(userId);
          console.log('🛒 Cart cleared after successful payment');
        } catch (cartError) {
          console.error('❌ Failed to clear cart:', cartError);
          // Continue anyway - payment was successful
        }

        Alert.alert(
          'Payment Successful',
          'Your order has been confirmed!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('OrderSuccess', { orderId }),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {order && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID:</Text>
                <Text style={styles.summaryValue}>#{order.order_id}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  ${(parseFloat(order.total_amount) - parseFloat(order.shipping_cost || 0)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping:</Text>
                <Text style={styles.summaryValue}>
                  ${parseFloat(order.shipping_cost || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  ${parseFloat(order.total_amount).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>

              <TouchableOpacity
                style={styles.paymentOption}
                onPress={handlePayment}
                disabled={!paymentReady || loading}
              >
                <Ionicons name="card" size={24} color={Colors.primary} />
                <Text style={styles.paymentText}>Credit or Debit Card</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <Text style={styles.paymentDescription}>
                Tap any option above or use the Pay button below to complete your purchase.
              </Text>
            </View>

            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.securityText}>
                256-bit SSL encryption • PCI DSS compliant
              </Text>
            </View>

            {/* Debug info */}
            {__DEV__ && (
              <View style={styles.debugSection}>
                <Text style={styles.debugText}>Debug Info:</Text>
                <Text style={styles.debugText}>Payment Ready: {paymentReady ? '✅' : '❌'}</Text>
                <Text style={styles.debugText}>Loading: {loading ? '⏳' : '✅'}</Text>
                <Text style={styles.debugText}>Order ID: {orderId}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!paymentReady || loading) && styles.checkoutButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!paymentReady || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.checkoutButtonText}>
                Pay ${order ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {!paymentReady && !loading && (
          <Text style={styles.footerNote}>Initializing secure payment...</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.gray,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.gray,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark,
    marginLeft: 12,
  },
  paymentDescription: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
    marginTop: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 13,
    color: Colors.success,
    marginLeft: 8,
    fontWeight: '500',
  },
  debugSection: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: Colors.gray,
  },
});