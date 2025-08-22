import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PayPal } from 'react-native-paypal';
import Colors from '../colors';

export default function BagScreen() {
  const SHIPPING_COST = 15.00;

  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Athletic Gear 1', details: 'Size L - Black', price: 45.99, quantity: 2 },
    { id: 2, name: 'Athletic Gear 2', details: 'Size M - Red', price: 52.99, quantity: 1 },
    { id: 3, name: 'Athletic Gear 3', details: 'Size XL - Blue', price: 38.95, quantity: 3 },
  ]);

  const incrementQuantity = (id) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (id) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  };

  const handlePayPalPayment = () => {
    const paymentData = {
      amount: total.toFixed(2),
      currency: 'USD',
      description: `Extreme Fit - ${totalItems} items`,
      clientId: 'AX5LCRqe63mpn5Iuk5dD6Z6E32Qn6skf2MdRRGmtDDPQwvKMdx76rqjSbYgISFz8L5fuR_sFGHmFy7fh', // Replace with your actual PayPal client ID
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
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, totalItems };
  }, [cartItems]);

  const total = subtotal + SHIPPING_COST;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 My Cart</Text>
          <Text style={styles.headerSubtitle}>{totalItems} items</Text>
        </View>

        <View style={styles.cartItems}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.productImage}>
                <Text style={styles.productImageText}>📦</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDetails}>{item.details}</Text>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.quantityControls}>
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
              </View>
            </View>
          ))}
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

        <TouchableOpacity style={styles.checkoutButton} onPress={handlePayPalPayment}>
          <Text style={styles.checkoutButtonText}>Pay with PayPal</Text>
          <Ionicons name="logo-paypal" size={20} color={Colors.whiteText} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  productImage: {
    backgroundColor: Colors.lightBackground,
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  productImageText: {
    fontSize: 20,
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
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    backgroundColor: Colors.mainColor,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 12,
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