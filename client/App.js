import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/Welcome';
import CreateAccountPage from './screens/CreateAccountPage';
import LogInPage from './screens/LogInPage.js';
import Navbar from './components/Navbar.js';
import EditProfileSection from './screens/edit_sections/EditProfile.js';
import EditAddressSection from './screens/edit_sections/EditAddress.js';
import ProductDetails from './screens/productDetails.js';
import OrderHistoryScreen from './screens/edit_sections/OrderHistory.js';
import OrderDetailsSection from './screens/edit_sections/OrderDetails.js'; 

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateAccountPage" component={CreateAccountPage} />
        <Stack.Screen name="LogInPage" component={LogInPage} />
        <Stack.Screen name="EditProfile" component={EditProfileSection} />
        <Stack.Screen name="EditAddress" component={EditAddressSection} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsSection} />
        <Stack.Screen name="Main" component={Navbar} />
        <Stack.Screen name="ProductDetails" component={ProductDetails}options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}