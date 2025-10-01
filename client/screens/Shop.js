import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { getCloudinaryImageUrl } from '../utils/cloudinary';
import Colors from '../colors';
import { format } from '@cloudinary/url-gen/actions/delivery';

export default function ShopScreen() {
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await ApiService.products.getAll();
      
      if (result.success) {
        setProducts(result.data);
      } else {
        Alert.alert('Error', 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    loadProducts();
  };

  const renderProduct = (product) => {
    // Get image source
    const getImageSource = () => {
      if (product.cloudinary_public_id) {
        const imageUrl = getCloudinaryImageUrl(product.cloudinary_public_id, { 
          format:'auto'
        });
        return { uri: imageUrl };
      }
      return null;
    };

    const imageSource = getImageSource();

  return (
    <TouchableOpacity key={product.product_id} style={styles.productCard}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.productImage}
          onError={() => console.log('Image failed to load for product:', product.name)}
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}

      {/* Wrap text in a container */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>
          ${parseFloat(product.price).toFixed(2)}
        </Text>
        {product.gender && (
          <Text style={styles.productGender}>
            {product.gender}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.grayIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Products</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsGrid}>
              {products.map(renderProduct)}
            </View>
          ) : (
            <Text style={styles.noResults}>No products available</Text>
          )}
        </View>
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
    paddingTop: 20,
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
  productsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 15,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productCard: {
    backgroundColor: Colors.whiteBackground,
    width: '45%',
    minHeight: 200,
    borderRadius: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productInfo: {
    padding: 10,
    flex: 1,
    justifyContent: 'flex-end',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  placeholderText: {
    color: Colors.mutedText,
    fontSize: 12,
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
    marginBottom: 5,
  },
  productGender: {
    fontSize: 12,
    color: Colors.mutedText,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.mutedText,
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.mutedText,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});