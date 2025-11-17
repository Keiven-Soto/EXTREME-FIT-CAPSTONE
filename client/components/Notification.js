// components/Notification.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../colors';
import { Ionicons } from '@expo/vector-icons';

// Hardcoded notifications
const notifications = [
  { id: 1, title: "Special Discount!", message: "Get 20% off on all XL Athletic Gear! Limited time only." },
  { id: 2, title: "Holiday Sale", message: "Extra 15% off on all footwear. Today only!" },
  { id: 3, title: "New Arrival Offer", message: "Buy 1 Get 1 Free on selected sports apparel." },
  { id: 4, title: "Member Exclusive", message: "VIP members enjoy 25% off on all accessories." },
  { id: 5, title: "Flash Deal", message: "Up to 30% off on workout equipment. Ends at midnight!" },
];

export default function NotificationDropdown() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <View>
      {/* Notification Menu Item */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowNotifications(!showNotifications)}
      >
        <View style={styles.menuItemLeft}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={Colors.mutedText} />
            {/* Notification Badge */}
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemText}>Notifications</Text>
        </View>
        <Ionicons
          name={showNotifications ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.mutedText}
        />
      </TouchableOpacity>

      {/* Dropdown Items */}
      {showNotifications && notifications.map((n) => (
        <View key={n.id} style={styles.notificationItem}>
          <Text style={styles.notificationTitle}>{n.title}</Text>
          <Text style={styles.notificationMessage}>{n.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.grayBorder 
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 16, color: Colors.darkText, marginLeft: 15, fontWeight: '500' },
  notificationItem: { paddingVertical: 10, paddingHorizontal: 30, backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  notificationTitle: { fontWeight: 'bold', marginBottom: 2 },
  notificationMessage: { fontSize: 14, color: Colors.darkText },

  // Badge styles
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
