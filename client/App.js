import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Navbar from './components/Navbar.js';

export default function App() {
  return (
    <NavigationContainer>
      <Navbar />
    </NavigationContainer>
  );
}