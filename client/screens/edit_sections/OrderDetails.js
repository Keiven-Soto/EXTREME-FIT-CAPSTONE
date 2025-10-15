import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../services/api';
import { getCloudinaryImageUrl } from '../../utils/cloudinary';

/* ========= Helpers para las secciones de info ========= */
function InfoSection({ title, children }) {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.infoTitle}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function InfoLine({ text }) {
  if (text && String(text).trim().length > 0) {
    return <Text style={styles.infoText}>{text}</Text>;
  }
  // Si no hay información, mostrar texto "No data" en vez de barra
  return <Text style={styles.infoText}>No data</Text>;
}

/* =================== Pantalla Order Details =================== */
export default function OrderDetailsSection({ navigation, route }) {
  const passedOrder = route?.params?.order || null;   // Opción A (recomendada)
  const passedOrderId = route?.params?.orderId || passedOrder?.id; // Opción B fallback

  const [loading, setLoading] = useState(!passedOrder);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(passedOrder); // { id, items[], totals... }

  
  // Cambia a tu IP local si usas dispositivo físico
  const API_URL = 'http://localhost:5001';

  // const API_URL = 'http://192.168.8.143:5001';
  

  // Si solo vino el orderId, hacemos fetch de items y totales
useEffect(() => {
  const fetchOrder = async () => {
    if (order || !passedOrderId) return;
    try {
      setLoading(true);
      
      // 1) Get order base data using ApiService
      const baseResult = await ApiService.orders.getById(passedOrderId);
      
      if (!baseResult.success) {
        throw new Error(baseResult.error || 'Failed to fetch order');
      }
      const base = baseResult.data;
      
      // 2) Get order items using ApiService
      const itemsResult = await ApiService.orders.getOrderItems(passedOrderId);
      
      if (!itemsResult.success) {
        throw new Error(itemsResult.error || 'Failed to fetch order items');
      }
      const items = itemsResult.data;

      // 3) For each item, get product info (image and name)
      const hydrated = await Promise.all(
        items.map(async (it) => {
          try {
            const prodResult = await ApiService.products.getById(it.product_id);
            const product = prodResult.data?.data || prodResult.data;
            
            return {
              ...it,
              name: product?.name || `Product #${it.product_id}`,
              size: it.size || '',
              color: it.color || '',
              image_url: product?.cloudinary_public_id 
                ? getCloudinaryImageUrl(product.cloudinary_public_id)
                : null,
              unit_price: Number(it.unit_price || product?.price || 0),
              qty: Number(it.quantity || 1),
            };
          } catch (err) {
            return {
              ...it,
              name: `Product #${it.product_id}`,
              size: it.size || '',
              color: it.color || '',
              image_url: null,
              unit_price: Number(it.unit_price || 0),
              qty: Number(it.quantity || 1),
            };
          }
        })
      );

      // 4) Calculate totals
      const subtotal = hydrated.reduce((acc, it) => acc + it.unit_price * it.qty, 0);
      const shipping = Number(base?.shipping_cost || 0);
      const ivu = 0.115;
      const taxes = +(subtotal * ivu).toFixed(2);
      const total = Number(subtotal + shipping + taxes);

      // 5) Set order data
      setOrder({
        id: base?.order_id ?? passedOrderId,
        createdAt: base?.created_at,
        status: base?.order_status,
        currency: 'USD',
        items: hydrated,
        charges: { subtotal, shipping, taxes, total },

        contact: {
          name: [base?.first_name, base?.last_name].filter(Boolean).join(' '),
          email: base?.email || '',
        },
        shippingMethod: base?.shipping_method || 'Standard',
        payment: { method: base?.payment_method || 'Card', last4: base?.card_last4 },

        address: {
          street_address: base?.street_address || '',
          city: base?.city || '',
          state: base?.state || '',
          postal_code: base?.postal_code || '',
          country: base?.country || '',
        },
      });
    } catch (e) {
      console.error('Order fetch error:', e);
      setError(e.message || 'Error loading order');
    } finally {
      setLoading(false);
    }
  };

  fetchOrder();
}, [passedOrderId]);

  // Si vino el objeto completo desde OrderHistory, normalizamos la forma
  useEffect(() => {
    if (!passedOrder) return;
    setOrder((prev) => {
      if (prev) return prev;
      return {
        id: passedOrder.id,
        createdAt: passedOrder.placedAt,
        status: passedOrder.status,
        currency: 'USD',
        items: (passedOrder.items || []).length
          ? passedOrder.items
          : (passedOrder.images || []).map((uri, idx) => ({
              product_id: idx + 1,
              name: 'Item',
              size: '',
              image_url: uri,
              unit_price: 0,
              qty: 1,
            })),
        charges: passedOrder.total
          ? { subtotal: passedOrder.total, shipping: 0, taxes: 0, total: passedOrder.total }
          : { subtotal: 0, shipping: 0, taxes: 0, total: 0 },

        // mocks mínimos para que veas la UI (borra si no los quieres)
        contact: passedOrder.contact || { name: '', email: '' },
        shippingMethod: passedOrder.shippingMethod || '',
        payment: passedOrder.payment || { method: '', last4: '' },
        shippingAddress: passedOrder.shippingAddress || { line1: '', line2: '', cityStateZip: '', country: '' },
        billingAddress: passedOrder.billingAddress || { line1: '', line2: '', cityStateZip: '', country: '' },
      };
    });
  }, [passedOrder]);

  const confirmedLabel = useMemo(() => {
    if (!order?.createdAt) return '';
    try {
      const d = new Date(order.createdAt);
      const options = { month: 'short', day: 'numeric' };
      return d.toLocaleDateString(undefined, options); // e.g., "Mar 9"
    } catch {
      return '';
    }
  }, [order?.createdAt]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.center}><Text>Loading...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text>{error}</Text></View>
        ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Items */}
        {order?.items?.map((it, i) => (
        <View key={i} style={styles.itemRow}>
          <View style={styles.thumbWrap}>
            <View style={styles.innerThumb}>
              {it?.image_url ? (
                <Image source={{ uri: it.image_url }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={20} color="#9ca3af" />
                </View>
              )}
            </View>

            {/* Quantity badge estilo “rounded square” */}
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{it.qty ?? 1}</Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {it.name || `Product #${it.product_id}`}
            </Text>
            {(!!it.size || !!it.color) && (
              <Text style={styles.itemSub}>
                {it.size ? `Size: ${it.size}` : ''}
                {it.size && it.color ? ' | ' : ''}
                {it.color ? `Color: ${it.color}` : ''}
              </Text>
            )}
          </View>

          <Text style={styles.itemPrice}>
            ${Number(it.unit_price || 0).toFixed(2)}
          </Text>
        </View>
        ))}


            <View style={styles.divider} />

            {/* Summary */}
            <View style={styles.summary}>
              <Row label="Subtotal" value={order?.charges?.subtotal} />
              <Row label="Shipping" value={order?.charges?.shipping} />
              <Row label="Taxes" value={order?.charges?.taxes} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLeft}>Total</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.currencyText}>{order?.currency || 'USD'}</Text>
                  <Text style={styles.totalText}>${Number(order?.charges?.total || 0).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Footer: Order # + Confirmed */}
            <View style={styles.footerCard}>
              <Text style={styles.orderId}>ORDER #{order?.id}</Text>
              {!!confirmedLabel && (
                <Text style={styles.muted}>Confirmed {confirmedLabel}</Text>
              )}
            </View>

            {/* ========== NUEVO: Panel de información extra (después de ORDER #) ========== */}
            <View style={styles.infoCard}>
              <InfoSection title="CONTACT INFORMATION">
                <InfoLine text={order?.contact?.name} />
                <InfoLine text={order?.contact?.email} />
              </InfoSection>

              <InfoSection title="ADDRESS">
                <InfoLine text={order?.address?.street_address} />
                <InfoLine text={order?.address?.city} />
                <InfoLine text={order?.address?.state} />
                <InfoLine text={order?.address?.postal_code} />
                <InfoLine text={order?.address?.country} />
              </InfoSection>

              <InfoSection title="PAYMENT METHOD">
                <InfoLine text={order?.payment?.method} />
              </InfoSection>


            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>${Number(value || 0).toFixed(2)}</Text>
    </View>
  );
}

/* =================== Estilos =================== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  iconBtn: { padding: 6, borderRadius: 999 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111' },
  cartWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#e11d48', minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 64 },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
  },
  thumbWrap: { width: 64, height: 64, borderRadius: 12, position: 'relative', overflow: 'visible', backgroundColor: '#f4f4f5' },
  innerThumb: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f4f4f5' },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  qtyText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  itemInfo: { flex: 1 },
  itemTitle: { fontWeight: '600', color: '#111' },
  itemSub: { color: '#6b7280', marginTop: 2 },
  itemPrice: { fontWeight: '600', color: '#111' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },

  summary: { gap: 8, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#111' },
  rowValue: { fontSize: 15, color: '#111' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 8, paddingTop: 8,
  },
  totalLeft: { fontSize: 18, fontWeight: '800', color: '#111' },
  currencyText: { color: '#6b7280', fontSize: 12, marginBottom: -2 },
  totalText: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3, color: '#111' },

  footerCard: { marginTop: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  orderId: { fontSize: 20, fontWeight: '900', letterSpacing: 0.3, color: '#111' },
  muted: { color: '#6b7280', marginTop: 6 },

  /* ======= NUEVOS estilos del panel de información ======= */
  infoCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoSection: { marginBottom: 18 },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: '#111',
    marginBottom: 8,
  },
  infoText: { fontSize: 14, color: '#111' },
  skeleton: {
    height: 14,
    borderRadius: 8,
    backgroundColor: '#ececec',
    width: '70%',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
