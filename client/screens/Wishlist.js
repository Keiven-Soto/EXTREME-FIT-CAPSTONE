import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '../colors';
import ApiService, { setGlobalAuthToken } from '../services/api';
import { useCurrentUser } from '../hooks/useAuthenticatedApi';
import { getCloudinaryImageUrl } from '../utils/cloudinary';

export default function WishlistScreen({ navigation }) {
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const useFocusEffect = require('@react-navigation/native').useFocusEffect;

  const [userId, setUserId] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  // Fetch authenticated user's database ID AND set the global token
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (isSignedIn) {
        try {
          // Get and set the token FIRST
          const token = await getToken();
          console.log('🎫 Setting global token in WishlistScreen:', !!token);
          setGlobalAuthToken(token);
          setTokenReady(true);

          // Then get user data
          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            console.log('✅ User ID obtained:', userData.user_id);
            setUserId(userData.user_id);
          } else {
            console.log('❌ Could not get user_id');
          }
        } catch (error) {
          console.error('❌ Error fetching user ID:', error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [isSignedIn]);

  // Fetch wishlist from backend
  const fetchWishlist = async () => {
    if (!userId) {
      console.log('No userId available, skipping wishlist fetch');
      return;
    }

    if (!tokenReady) {
      console.log('Token not ready yet, skipping wishlist fetch');
      return;
    }

    console.log('🛍️ Fetching wishlist for userId:', userId);
    setLoading(true);

    try {
      const result = await ApiService.wishlist.get(userId);
      console.log('🛍️ Wishlist API result:', result);

      if (result.success) {
        // Fetch product details for each wishlist item
        const itemsWithDetails = await Promise.all(
          result.data.map(async (item) => {
            try {
              const productResult = await ApiService.products.getById(item.product_id);
              if (productResult.success) {
                return {
                  wishlist_id: item.wishlist_id,
                  product_id: item.product_id,
                  added_at: item.added_at,
                  ...productResult.data,
                };
              }
              return null;
            } catch (error) {
              console.error('Error fetching product details:', error);
              return null;
            }
          })
        );

        // Filter out null values
        const validItems = itemsWithDetails.filter((item) => item !== null);
        console.log('🛍️ Wishlist items loaded:', validItems.length);
        setWishlistItems(validItems);
      } else {
        console.error('❌ Error loading wishlist:', result.error);
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('❌ Exception loading wishlist:', error);
      Alert.alert('Error', 'Could not load wishlist');
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch wishlist when BOTH userId AND token are ready
  useEffect(() => {
    if (userId && tokenReady) {
      fetchWishlist();
    }
  }, [userId, tokenReady]);

  // Refresh wishlist when screen receives focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId && tokenReady) {
        fetchWishlist();
      }
    }, [userId, tokenReady])
  );

  const removeFromWishlist = async (productId) => {
    try {
      const result = await ApiService.wishlist.remove(userId, productId);
      if (result.success) {
        console.log('✅ Removed from wishlist');
        // Refresh wishlist
        await fetchWishlist();
      } else {
        Alert.alert('Error', result.error || 'Could not remove from wishlist');
      }
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
      Alert.alert('Error', 'Could not remove from wishlist');
    }
  };

  const goToProduct = (productId) => {
    navigation.navigate('ProductDetails', { productId });
  };

  // Add to cart and remove from wishlist
  const addToCart = async (product) => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to add items to cart');
      return;
    }

    try {
      // First, add the item to the cart
      const cartResult = await ApiService.cart.addItem(userId, product.product_id, 1, '', '');

      if (cartResult.success) {
        const wishlistResult = await ApiService.wishlist.remove(userId, product.product_id);

        if (wishlistResult.success) {
          Alert.alert('Success!', 'Item added to cart.');
          // Refresh the wishlist to show updated list
          await fetchWishlist();
        } 
      } else {
        Alert.alert('Error', cartResult.error || 'Could not add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Could not add to cart');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => goToProduct(item.product_id)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.cloudinary_public_id ? (
            <Image
              source={{ uri: getCloudinaryImageUrl(item.cloudinary_public_id) }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={Colors.mutedText} />
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
          
          {item.stock_quantity !== undefined && (
            <Text
              style={[
                styles.stockText,
                item.stock_quantity === 0 && styles.outOfStock,
              ]}
            >
              {item.stock_quantity === 0
                ? 'Out of Stock'
                : item.stock_quantity < 10
                ? `Only ${item.stock_quantity} left`
                : 'In Stock'}
            </Text>
          )}

          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={(e) => {
              e.stopPropagation();
              addToCart(item);
            }}
            disabled={item.stock_quantity === 0}
          >
            <Ionicons name="cart-outline" size={16} color={Colors.whiteText} />
            <Text style={styles.addToCartText}>
              {item.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            removeFromWishlist(item.product_id);
          }}
        >
          <Ionicons name="heart" size={24} color={Colors.errorColor || '#ef4444'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={Colors.mutedText} />
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite items here
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.mainColor} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.wishlist_id.toString()}
          contentContainerStyle={
            wishlistItems.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground || '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.whiteBackground || '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder || '#e5e5e5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.darkText || '#000',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.mutedText || '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.mutedText || '#666',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText || '#000',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.mutedText || '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: Colors.mainColor || '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: Colors.whiteText || '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  wishlistItem: {
    backgroundColor: Colors.whiteBackground || '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 15,
  },
  imageContainer: {
    width: 100,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.lightBackground || '#f5f5f5',
    marginRight: 15,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText || '#000',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.mutedText || '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.mainColor || '#000',
    marginBottom: 5,
  },
  stockText: {
    fontSize: 12,
    color: Colors.successColor || '#22c55e',
    marginBottom: 10,
  },
  outOfStock: {
    color: Colors.errorColor || '#ef4444',
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: Colors.mainColor || '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  addToCartText: {
    color: Colors.whiteText || '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 15,
    right: 15,
  },
});