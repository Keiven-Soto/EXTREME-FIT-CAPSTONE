import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---- Mock data ----
const ORDERS = [
  {
    id: '154039262',
    status: 'Delivered',
    dateLabel: 'MONDAY, MAR. 17',
    total: 92.95,
    placedAt: 'Mar. 9/25',
    images: [
      'https://picsum.photos/seed/fit1/600/800',
      'https://picsum.photos/seed/fit2/600/800',
    ],
  },
  {
    id: '118140056',
    status: 'EXCEPTION',
    dateLabel: null,
    total: 111.45,
    placedAt: 'Jul. 30/23',
    images: [
      'https://picsum.photos/seed/short1/600/800',
      'https://picsum.photos/seed/short2/600/800',
      'https://picsum.photos/seed/short3/600/800',
    ],
  },
  {
    id: '107717863',
    status: 'EXCEPTION',
    dateLabel: null,
    total: 109.22,
    placedAt: 'Jan. 5/23',
    images: [
      'https://picsum.photos/seed/acc1/600/800',
      'https://picsum.photos/seed/acc2/600/800',
      'https://picsum.photos/seed/acc3/600/800',
      'https://picsum.photos/seed/acc4/600/800',
    ],
  },
];

function OrderCard({ order, onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbRow}>
        {order.images.slice(0, 3).map((uri, i) => (
          <View key={i} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
          </View>
        ))}
      </View>

      <Text style={styles.metaText}>
        <Text style={{ color: '#666' }}>Order </Text>
        <Text style={styles.metaLink}>#{order.id}</Text>
        <Text> • ${order.total.toFixed(2)} • {order.placedAt}</Text>
      </Text>

      <TouchableOpacity onPress={onPress} style={styles.detailsBtn}>
        <Text style={styles.detailsBtnText}>View Order</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const delivered = ORDERS.filter((o) => o.status === 'Delivered');
  const exceptions = ORDERS.filter((o) => o.status === 'EXCEPTION');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack?.()}> 
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        {/* <View style={styles.bagWrap}>
          <Ionicons name="bag-outline" size={22} color="#111" />
          <View style={styles.badge}><Text style={styles.badgeText}>7</Text></View>
        </View> */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivered block */}
        {delivered.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.orderStatus}>Delivered</Text>
            <Text style={styles.bigTitle}>{delivered[0].dateLabel}</Text>
            <OrderCard order={delivered[0]} onPress={() => {}} />
          </View>
        )}

        {/* Exceptions */}
        {exceptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.orderStatus}>Delivered</Text>
            <Text style={styles.sectionTitle}>EXCEPTION</Text>
            {exceptions.map((o) => (
              <OrderCard key={o.id} order={o} onPress={() => {}} />)
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' , textAlign: 'center', flex: 1 },
  iconBtn: { padding: 6, borderRadius: 999 },
  bagWrap: { position: 'relative', padding: 6 },
  badge: {
    position: 'absolute',
    right: 2,
    top: 0,
    height: 18,
    width: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 96 },
  section: { marginBottom: 28 },
  orderStatus: { color: '#059669', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  bigTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.3, marginBottom: 12 },
  sectionTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },

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
  thumbRow: { flexDirection: 'row', gap: 10 },
  thumbWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f4f4f5' },
  thumb: { width: '100%', aspectRatio: 3/4 },
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

  tabbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: { alignItems: 'center', gap: 2, paddingVertical: 6, width: '20%' },
  tabLabel: { fontSize: 11, color: '#6b7280' },
  badgeMini: {
    position: 'absolute',
    right: -6,
    top: -4,
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMiniText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
