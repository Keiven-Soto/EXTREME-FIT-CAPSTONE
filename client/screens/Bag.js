import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { getCloudinaryImageUrl } from '../utils/cloudinary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../colors';
import ApiService from '../services/api';

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
  // Pago simulado
  const handleSimulatedPayment = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Error', 'El carrito está vacío. Agrega productos antes de pagar.');
      return;
    }

    try {
      // 1. Buscar dirección default del usuario
      const addressResult = await ApiService.addresses.getByUser(userId);
      let defaultAddress = null;
      if (addressResult.success && Array.isArray(addressResult.data)) {
        defaultAddress = addressResult.data.find(addr => addr.is_default);
      }
      if (!defaultAddress) {
        Alert.alert('Error', 'No tienes una dirección de envío predeterminada. Agrega una dirección en tu perfil.');
        return;
      }

      // 2. Crear la orden en el backend con shipping_address_id
      const orderPayload = {
        user_id: userId,
        total_amount: subtotal + SHIPPING_COST,
        shipping_cost: SHIPPING_COST,
        payment_method: 'simulado',
        payment_status: 'pagado',
        order_status: 'confirmado',
        shipping_address_id: defaultAddress.address_id,
      };
      const orderResult = await ApiService.orders.create(orderPayload);
      if (!orderResult || !orderResult.order_id) {
        Alert.alert('Error', 'No se pudo crear la orden.');
        return;
      }
      const orderId = orderResult.order_id;

      // 3. Crear los order items
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
        Alert.alert('Error', 'No se pudieron guardar todos los productos en la orden.');
        return;
      }

      // 4. Vaciar el carrito en backend y frontend SIEMPRE después de pagar
      await ApiService.cart.clear(userId);
      setCartItems([]);
      Alert.alert(
        'Pago exitoso',
        '¡Pago simulado realizado correctamente!',
        [
          {
            text: 'Ver orden',
            onPress: () => {
              navigation.navigate('OrderDetails', { orderId });
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Hubo un problema al procesar la orden.');
    }
  };
  // Import useNavigation and useFocusEffect
  const navigation = require('@react-navigation/native').useNavigation();
  const useFocusEffect = require('@react-navigation/native').useFocusEffect;
  const SHIPPING_COST = 15.00; //TODO: Ajustar costo de envío según sea necesario

  // Reemplaza esto por el userId real (ejemplo: de contexto, auth, etc.)
  const userId = 1;
  const [cartItems, setCartItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Función para obtener el carrito desde el backend
  const fetchCart = async () => {
    setLoadingItems(true);
    const result = await ApiService.cart.get(userId);
    if (result.success) {
      // Espera medio segundo antes de mostrar los items
      setTimeout(() => {
        setCartItems(result.data.map(item => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image_url: item.cloudinary_public_id ? getCloudinaryImageUrl(item.cloudinary_public_id) : null,
        })));
        setLoadingItems(false);
      }, 500);
    } else {
      Alert.alert('Error', result.error || 'No se pudo cargar el carrito');
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  // Refresca el carrito cada vez que la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      fetchCart();
    }, [userId])
  );

  // Actualizar cantidad en el backend y refrescar el carrito
  const incrementQuantity = async (id) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + 1;
    const result = await ApiService.cart.updateQuantity(userId, id, newQty);
    if (result.success) {
      await fetchCart();
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar la cantidad');
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
      Alert.alert('Error', result.error || 'No se pudo actualizar la cantidad');
    }
  };

  // Eliminar producto del carrito y refrescar
  const removeItem = async (id) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    const result = await ApiService.cart.removeItem(userId, id);
    if (result.success) {
      await fetchCart();
    } else {
      Alert.alert('Error', result.error || 'No se pudo eliminar el producto');
    }
  };

  // TODO: Implementar PayPal -----
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
          {loadingItems ? (
            <View style={styles.loadingItemsContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading...</Text>
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

        <TouchableOpacity style={styles.checkoutButton} onPress={handlePayPalPayment}>
          <Text style={styles.checkoutButtonText}>Pay with PayPal</Text>
          <Ionicons name="logo-paypal" size={20} color={Colors.whiteText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.testingcheckoutButton} onPress={handleSimulatedPayment}>
          <Text style={styles.checkoutButtonText}>Pagar ahora</Text>
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