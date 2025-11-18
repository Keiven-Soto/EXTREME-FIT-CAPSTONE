import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../colors';
import ApiService from '../services/api';
import { color } from '@cloudinary/url-gen/qualifiers/background';

export default function OrderSuccessScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Poll for payment completion (webhook might take a moment)
      let attempts = 0;
      const maxAttempts = 5;

      const checkOrder = async () => {
        const result = await ApiService.orders.getById(orderId);

        if (result.success) {
          const orderData = result.data;

          // Check if payment is confirmed
          if (orderData.payment_status === 'paid' || orderData.payment_completed_at) {
            setOrder(orderData);
            setLoading(false);
            return true;
          }
        }
        return false;
      };

      // Try immediately first
      const isComplete = await checkOrder();

      if (!isComplete) {
        // If not complete, poll every 2 seconds
        const interval = setInterval(async () => {
          attempts++;
          const complete = await checkOrder();

          if (complete || attempts >= maxAttempts) {
            clearInterval(interval);
            if (!complete) {
              // Even if not confirmed, show the order
              const result = await ApiService.orders.getById(orderId);
              if (result.success) {
                setOrder(result.data);
              }
              setLoading(false);
            }
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleViewOrder = () => {
    navigation.navigate('OrderDetails', { orderId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Confirming your payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = order?.payment_status === 'paid' || order?.payment_completed_at;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, isPaid ? styles.successCircle : styles.pendingCircle]}>
            <Ionicons
              name={isPaid ? "checkmark-circle" : "time"}
              size={80}
              color={isPaid ? Colors.success : Colors.warning}
            />
          </View>
        </View>

        <Text style={styles.title}>
          {isPaid ? 'Payment Successful!' : 'Order Received!'}
        </Text>

        <Text style={styles.subtitle}>
          {isPaid
            ? 'Thank you for your purchase. Your order has been confirmed.'
            : 'Your order is being processed. You\'ll receive a confirmation email shortly.'
          }
        </Text>

        {order && (
          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Order Number:</Text>
              <Text style={styles.orderValue}>#{order.order_id}</Text>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Total Amount:</Text>
              <Text style={styles.orderValue}>
                ${parseFloat(order.total_amount).toFixed(2)}
              </Text>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Status:</Text>
              <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={styles.statusText}>
                  {isPaid ? 'Paid' : order.payment_status || 'Processing'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            A confirmation email has been sent to your registered email address with order details and tracking information.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewOrder}
          >
            <Text style={styles.primaryButtonText}>View Order Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContinueShopping}
          >
            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    backgroundColor: '#e8f5e9',
  },
  pendingCircle: {
    backgroundColor: '#fff3e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  orderCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderLabel: {
    fontSize: 16,
    color: Colors.gray,
  },
  orderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidBadge: {
    backgroundColor: '#e8f5e9',
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.mainColor,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
