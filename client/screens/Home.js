import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../colors';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>🏠 Home</Text>
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
  screenText: {
    fontSize: 18,
    color: Colors.mutedText,
    textAlign: 'center',
  },
});