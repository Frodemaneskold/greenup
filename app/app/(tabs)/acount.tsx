import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AcountScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Acount</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});


