import { Stack } from 'expo-router';
import React from 'react';

export default function AccountStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#a7c7a3' },
        headerTitleStyle: { color: '#1f1f1f' },
        headerTintColor: '#1f1f1f',
        headerShadowVisible: false,
      }}
    />
  );
}


