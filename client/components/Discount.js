import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../colors';

export default function Discount({ price, discountPercentage }) {
  if (!discountPercentage) {
    return <Text style={styles.price}>${parseFloat(price).toFixed(2)}</Text>;
  }

  const discountedPrice = (parseFloat(price) * (1 - discountPercentage / 100)).toFixed(2);

  return (
    <View style={styles.container}>
      <Text style={styles.originalPrice}>${parseFloat(price).toFixed(2)}</Text>
      <Text style={styles.discountedPrice}>${discountedPrice}</Text>
      <Text style={styles.percentage}>-{discountPercentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: Colors.mutedText,
    fontSize: 16,
  },
  discountedPrice: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
  percentage: {
    color: 'red',
    fontWeight: 'bold',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
});
