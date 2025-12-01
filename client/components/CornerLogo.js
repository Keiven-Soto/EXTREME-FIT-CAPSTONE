// components/CornerLogo.js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function CornerLogo() {
  return (
    <View style={styles.logoContainer}>
      {/* Left text */}
      <Text style={styles.title}>Extreme Fit</Text>

      {/* Logo image */}
      <Image
        source={require('../assets/Extreme_fit_new_logo-10.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    position: 'static',
    top: 10,
    right: 10,
    flexDirection: 'row',  
    alignItems: 'center',
    zIndex: 9999,
  },
  title: {
    fontSize: 14,
    color: '#555',         
    marginRight: 6,
    fontWeight: '500',
    opacity: 0.8,             
  },
  logo: {
    width: 40,
    height: 40,
    opacity: 0.9,
  },
});
