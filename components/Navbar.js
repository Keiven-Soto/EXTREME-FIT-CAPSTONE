import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../colors';

// Importar las pantallas
import HomeScreen from '../screens/Home';
import ShopScreen from '../screens/Shop';
import BagScreen from '../screens/Bag';
import WishlistScreen from '../screens/Wishlist';
import ProfileScreen from '../screens/Profile';

const Tab = createBottomTabNavigator();

export default function Navbar() {
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
        tabBarStyle: {
          backgroundColor: Colors.whiteBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.lightBorder,
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen 
        name="Bag" 
        component={BagScreen}
        options={{
          tabBarBadge: 7,
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