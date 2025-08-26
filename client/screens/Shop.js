import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../colors';

export default function ShopScreen() {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    console.log('Buscando:', searchText);
    // Aquí implementarías la lógica de búsqueda
  };

  const clearSearch = () => {
    setSearchText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSubtitle}>Find your athletic gear</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.grayIcon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={Colors.grayIcon}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.grayIcon} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.filterIconButton} onPress={handleSearch}>
              <Ionicons name="options" size={20} color={Colors.mainColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {['Activewear', 'Footwear', 'Accessories', 'Equipment'].map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Products */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
          <View style={styles.productsGrid}>
            {[1, 2, 3, 4].map((item) => (
              <TouchableOpacity key={item} style={styles.productCard}>
                <View style={styles.productImage}>
                  <Text style={styles.productImageText}>📦</Text>
                </View>
                <Text style={styles.productName}>Product {item}</Text>
                <Text style={styles.productPrice}>$29.99</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {searchText.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>
              Results for "{searchText}"
            </Text>
            <Text style={styles.noResults}>
              {searchText ? `Searching for products related to "${searchText}"...` : ''}
            </Text>
          </View>
        )}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
  },
  clearButton: {
    padding: 5,
  },
  filterIconButton: {
    padding: 5,
    marginLeft: 5,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    backgroundColor: Colors.mainColor,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  categoryText: {
    color: Colors.whiteText,
    fontWeight: '600',
    fontSize: 14,
  },
  productsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productCard: {
    backgroundColor: Colors.whiteBackground,
    width: '47%',
    borderRadius: 12,
    padding: 15,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    backgroundColor: Colors.lightBackground,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImageText: {
    fontSize: 24,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.mainColor,
  },
  searchResults: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  noResults: {
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});