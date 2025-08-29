
import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import Colors from '../colors';
// Puedes cambiar el nombre del archivo si quieres otra imagen
import logo from '../assets/Extreme_fit_new_logo-07.png';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>🏠 Home</Text>
      {/* Imagen centrada en la pantalla */}
      <Image source={logo} style={styles.centerImage} resizeMode="contain" />
      <Text style={styles.screenText}>Welcome to Extreme Fit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightBackground,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 10,
  },
  centerImage: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  screenText: {
    fontSize: 18,
    color: Colors.mutedText,
    textAlign: 'center',
  },
});