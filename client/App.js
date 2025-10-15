import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from './utils/tokenCache';
import WelcomeScreen from './screens/Welcome';
import CreateAccountPage from './screens/CreateAccountPage';
import LogInPage from './screens/LogInPage';
import ForgotPasswordPage from './screens/ForgotPasswordPage';
import Navbar from './components/Navbar';
import EditProfileSection from './screens/edit_sections/EditProfile';
import EditAddressSection from './screens/edit_sections/EditAddress';
import ProductDetails from './screens/productDetails';
import OrderHistoryScreen from './screens/edit_sections/OrderHistory';
import OrderDetailsSection from './screens/edit_sections/OrderDetails';
import SignOutButton from './components/SignOutButton';
import ProfileScreen from './screens/Profile.js';

//neW IMPORTS
import HomeScreen from "./screens/Home";
import ShopScreen from "./screens/Shop";
import CategoryProducts from "./screens/CategoryProducts.js";
const Stack = createStackNavigator();

export default function App() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} /> 
          <Stack.Screen name="Shop" component={ShopScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          {/* <Stack.Screen name="SignOut" component={SignOutButton} /> */}
          <Stack.Screen name="CategoryProducts" component={CategoryProducts} />
          <Stack.Screen name="CreateAccountPage" component={CreateAccountPage} />
          <Stack.Screen name="LogInPage" component={LogInPage} />
          <Stack.Screen name="ForgotPasswordPage" component={ForgotPasswordPage} />
          <Stack.Screen name="Main" component={Navbar} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsSection} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen}options={{ headerShown: false }}/>
          <Stack.Screen name="EditProfile" component={EditProfileSection} />
          <Stack.Screen name="EditAddress" component={EditAddressSection} />
          <Stack.Screen name="ProductDetails" component={ProductDetails} options={{ headerShown: false }}/>
        </Stack.Navigator>
      </NavigationContainer>
    </ClerkProvider>
  );
}console.log('Clerk Key:', process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
