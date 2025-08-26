import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../colors';

export default function WishlistScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSubtitle}>Your favorite products</Text>
        </View>

        <View style={styles.wishlistItems}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.wishlistItem}>
              <View style={styles.productImage}>
                <Text style={styles.productImageText}>📦</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>Premium Athletic Wear {item}</Text>
                <Text style={styles.productDescription}>
                  High-performance athletic clothing for your workout needs
                </Text>
                <Text style={styles.productPrice}>$32.99</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.addToBagButton}>
                    <Ionicons name="bag-add" size={16} color={Colors.whiteText} />
                    <Text style={styles.addToBagText}>Add to Cart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeButton}>
                    <Ionicons name="heart-dislike" size={16} color={Colors.mainColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            💡 Tip: Tap the ❤️ on any product to add it to your wishlist
          </Text>
        </View>

        <TouchableOpacity style={styles.continueShoppingButton}>
          <Ionicons name="storefront" size={20} color={Colors.mainColor} />
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
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
  wishlistItems: {
    paddingHorizontal: 20,
  },
  wishlistItem: {
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    backgroundColor: Colors.lightBackground,
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  productImageText: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.mainColor,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addToBagButton: {
    backgroundColor: Colors.mainColor,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  addToBagText: {
    color: Colors.whiteText,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: Colors.lightBackground,
    width: 40,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mainColor,
  },
  emptyState: {
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
  emptyStateText: {
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueShoppingButton: {
    backgroundColor: Colors.whiteBackground,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.mainColor,
  },
  continueShoppingText: {
    color: Colors.mainColor,
    fontSize: 18,
    fontWeight: 'bold',
  },
});