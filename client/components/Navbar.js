import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../colors';
import { useAuth } from '@clerk/clerk-expo';
import ApiService, { setGlobalAuthToken } from '../services/api';
import { useCurrentUser } from '../hooks/useAuthenticatedApi';
import emitter, { CART_UPDATED } from '../utils/events';

// Importar las pantallas
import HomeScreen from '../screens/Home';
import ShopScreen from '../screens/Shop';
import BagScreen from '../screens/Bag';
import WishlistScreen from '../screens/Wishlist';
import ProfileScreen from '../screens/Profile';

const Tab = createBottomTabNavigator();

export default function Navbar() {
  const { getToken, isSignedIn } = useAuth();
  const { getCurrentUser } = useCurrentUser();
  const [userId, setUserId] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [tokenReady, setTokenReady] = useState(false);

  // Fetch user ID and set token
  useEffect(() => {
    const fetchUserIdAndSetToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          setGlobalAuthToken(token);
          setTokenReady(true);

          const userData = await getCurrentUser();
          if (userData && userData.user_id) {
            setUserId(userData.user_id);
          }
        } catch (error) {
          console.error("Error fetching user ID in Navbar:", error);
        }
      }
    };
    fetchUserIdAndSetToken();
  }, [isSignedIn]);

  // Fetch cart count
  const fetchCartCount = async () => {
    if (!userId || !tokenReady) return;

    try {
      const result = await ApiService.cart.get(userId);
      if (result.success && Array.isArray(result.data)) {
        const totalItems = result.data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [userId, tokenReady]);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('🔔 Cart updated event received in Navbar');
      fetchCartCount();
    };

    emitter.on(CART_UPDATED, handleCartUpdate);

    return () => {
      emitter.off(CART_UPDATED, handleCartUpdate);
    };
  }, [userId, tokenReady]);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Bag') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Me') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.mainColor,
        tabBarInactiveTintColor: Colors.grayIcon,
        tabBarShowLabel: false, // ← Esto debería ocultar todos los labels
        tabBarStyle: {
          backgroundColor: Colors.whiteBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.lightBorder,
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: { display: 'none' }, // removes names in the navbar
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen
        name="Bag"
        component={BagScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.mainColor,
            color: Colors.whiteText,
            fontSize: 12,
          },
        }}
      />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
}