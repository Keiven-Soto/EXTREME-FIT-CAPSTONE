import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StripeProvider } from '@stripe/stripe-react-native';
import { tokenCache } from './utils/tokenCache';
import WelcomeScreen from './screens/Welcome';
import CreateAccountPage from './screens/CreateAccountPage';
import LogInPage from './screens/LogInPage';
import ForgotPasswordPage from './screens/ForgotPasswordPage';
import Navbar from './components/Navbar';
import EditProfileSection from './screens/edit_sections/EditProfile';
import EditAddressSection from './screens/edit_sections/EditAddress';
import ChangePasswordSection from './screens/edit_sections/ChangePassword';
import ProductDetails from './screens/productDetails';
import OrderHistoryScreen from './screens/edit_sections/OrderHistory';
import OrderDetailsSection from './screens/edit_sections/OrderDetails';
import SignOutButton from './components/SignOutButton';
import ProfileScreen from './screens/Profile.js';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderSuccessScreen from './screens/OrderSuccessScreen';
import TermsScreen from './screens/profile_sections/TermsScreen.js';
import HelpSupportScreen from './screens/profile_sections/HelpSupportScreen.js';
import HomeScreen from "./screens/Home";
import ShopScreen from "./screens/Shop";
import CategoryProducts from "./screens/CategoryProducts.js";
import BagScreen from './screens/Bag.js';
import WishlistScreen from './screens/Wishlist.js';
const Stack = createStackNavigator();

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SQHcLRdLUiaccnhzY87NWsWGA1ZhBbpD4qLLPP509FoGFhNw0q1okFxdy21ehbYU0Vs0aiialgI60b9hSCnVKzE00HYkwfjV2';

export default function App() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.extremefit"
        urlScheme="extremefit"
      >
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Home" component={HomeScreen} /> 
            <Stack.Screen name="Shop" component={ShopScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Bag" component={BagScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="CategoryProducts" component={CategoryProducts} />
            <Stack.Screen name="CreateAccountPage" component={CreateAccountPage} />
            <Stack.Screen name="LogInPage" component={LogInPage} />
            <Stack.Screen name="ForgotPasswordPage" component={ForgotPasswordPage} />
            <Stack.Screen name="Main" component={Navbar} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsSection} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="EditProfile" component={EditProfileSection} />
            <Stack.Screen name="EditAddress" component={EditAddressSection} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordSection} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} options={{ headerShown: false }}/>
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }}/>
            <Stack.Screen name= "TermsScreen" component={TermsScreen} />
            <Stack.Screen name = "HelpSupportScreen" component={HelpSupportScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </ClerkProvider>
  );
}
