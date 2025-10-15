import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import ApiService, { setGlobalAuthToken } from '../../services/api';
import { getCloudinaryImageUrl } from '../../utils/cloudinary';

/**
 * @file OrderHistory.js
 * @brief Pantalla de historial de órdenes para el usuario autenticado.
 * @module screens/edit_sections/OrderHistory
 *
 * Este componente obtiene las órdenes del usuario (user_id=1) desde el backend y las muestra en una lista.
 * Cada orden se muestra con su total, fecha y un botón para ver detalles.
 */

// ================== COMPONENTE TARJETA ==================
function OrderCard({ order, onPress, navigation }) {

  const gotoOrderDetailsSection = () => {
      navigation && navigation.navigate('OrderDetails', { orderId: order.id });
  };
  // Calcula 3 columnas iguales dentro de la tarjeta, miniaturas más pequeñas
  const SCREEN_W = Dimensions.get('window').width;
  const CARD_HPAD = 12;              // padding horizontal de .card
  const COLS = 3;
  const GAP = 8;                     // separación entre miniaturas

  // Tamaño de las imágenes (ajustar aquí si se desea otro tamaño)
  const itemW = 100;
  const itemH = 150;

  // Mostrar solo la cantidad de imágenes igual al número de productos (1, 2 o hasta 3)
  // No rellenar con null si son menos de 3
  const thumbs = order.images.slice(0, 3);

  const total = typeof order.total === 'number' ? order.total : Number(order.total);

  // Contenedor principal de la tarjeta
  return (
    <View style={styles.card}>
      {/* Thumbnails row */}
      <View style={[styles.thumbRow, { gap: GAP }]}> 
        {thumbs.map((uri, i) => (
          <View
            key={i}
            style={[styles.thumbWrap, { width: itemW, height: itemH }]}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Ionicons name="image-outline" size={20} color="#9ca3af" />
                <Text style={styles.placeholderText}>No image</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Order info text */}
      <Text style={styles.metaText}>
        <Text style={{ color: '#666' }}>Order </Text>
        <Text style={styles.metaLink}>#{order.id}</Text>
        <Text> • ${!isNaN(total) ? total.toFixed(2) : '0.00'} • {order.placedAt}</Text>
      </Text>

      {/* Details button */}
      <TouchableOpacity onPress={gotoOrderDetailsSection} style={styles.detailsBtn}>
        <Text style={styles.detailsBtnText}>View Order</Text>
      </TouchableOpacity>
    </View>
  );
}

// ================== PANTALLA PRINCIPAL ==================
export default function OrderHistoryScreen({ navigation }) {
  const { getToken, isSignedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchOrdersWithImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      setGlobalAuthToken(token);

      const currentUser = await ApiService.users.getCurrentUser();

      if (!currentUser || !currentUser.user_id) {
        throw new Error('User not authenticated');
      }

      const ordersResult = await ApiService.orders.getByUser(currentUser.user_id);
      if (!ordersResult.success) {
        throw new Error(ordersResult.error || 'Failed to fetch orders');
      }
      const orders = ordersResult.data || [];

      const ordersWithImages = await Promise.all(
        orders.map(async (order) => {
          try {
            const itemsResult = await ApiService.orders.getOrderItems(order.order_id);
            const orderItems = itemsResult.success ? itemsResult.data || [] : [];

            const images = await Promise.all(
              orderItems.map(async (item) => {
                try {
                  const productResult = await ApiService.products.getById(item.product_id);
                  if (!productResult.success) return null;
                  
                  const product = productResult.data?.data || productResult.data;
                  if (product?.cloudinary_public_id) {
                    return getCloudinaryImageUrl(product.cloudinary_public_id);
                  }
                  if (product?.image_url) {
                    return product.image_url;
                  }
                  return null;
                } catch (err) {
                  return null;
                }
              })
            );

            return { ...order, images: images.filter(Boolean) };
          } catch (err) {
            return { ...order, images: [] };
          }
        })
      );

      setOrders(ordersWithImages);
    } catch (err) {
      console.error('Order fetch error:', err);
      setError(err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };
  fetchOrdersWithImages();
}, []);

  return (
    <SafeAreaView style={styles.safeArea}> 
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{error}</Text>
            <Text style={{ color: 'red', fontSize: 12, marginTop: 8 }}>
              {error === 'Error loading orders' ? '¿Estás usando localhost en un dispositivo físico? Usa la IP local de tu PC.' : ''}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {orders.length === 0 ? (
              <Text>No orders found.</Text>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  navigation={navigation}
                  order={{
                    id: order.order_id,
                    status: order.order_status,
                    dateLabel: order.created_at ? new Date(order.created_at).toDateString() : '',
                    total: order.total_amount,
                    placedAt: order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
                    images: order.images || [],
                  }}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ================== ESTILOS ==================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111', textAlign: 'center', flex: 1 },
  iconBtn: { padding: 6, borderRadius: 999 },

  scroll: { padding: 16, paddingBottom: 96 },

  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },

  // ==== miniaturas ====
  thumbRow: { flexDirection: 'row' },
  thumbWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f4f4f5',
  },
  thumb: { width: '100%', height: '100%', borderRadius: 8 },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: { fontSize: 12, color: '#9ca3af' },

  metaText: { marginTop: 10, color: '#111', fontSize: 14 },
  metaLink: { textDecorationLine: 'underline', fontWeight: '600', color: '#111' },
  detailsBtn: {
    marginTop: 10,
    backgroundColor: '#f4f4f5',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  detailsBtnText: { fontSize: 16, fontWeight: '700', color: '#111' },
});
