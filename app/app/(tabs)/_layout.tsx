import { Tabs, Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="acount"
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0, // Android shadow
        },
        tabBarBackground: () => (
          <>
            <BlurView
              intensity={55}
              tint={(colorScheme ?? 'light') as 'light' | 'dark' | 'default'}
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.10)' }]}
            />
          </>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hem',
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitleStyle: { color: '#1f1f1f' },
          headerTintColor: '#1f1f1f',
          headerRight: () => (
            <Link href="/notifications" asChild>
              <TouchableOpacity
                accessibilityLabel="Visa notiser"
                style={{
                  backgroundColor: '#2f7147',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="envelope.fill" size={20} color="#fff" />
              </TouchableOpacity>
            </Link>
          ),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Topplista',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Skapa',
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitleStyle: { color: '#1f1f1f' },
          headerTintColor: '#1f1f1f',
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'Information',
          tabBarLabel: 'info',
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitleStyle: { color: '#1f1f1f' },
          headerTintColor: '#1f1f1f',
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="acount"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
