import { Tabs, Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="index"
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
          headerShadowVisible: false,
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
                <Image
                  source={{
                    uri: 'https://img.icons8.com/?size=100&id=5lr6xIUAwiha&format=png&color=000000',
                  }}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Link>
          ),
          tabBarIcon: ({ color }) => (
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=100&id=8xhovyHdOQzF&format=png&color=000000',
              }}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Tävlingar',
          tabBarIcon: ({ color }) => (
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=100&id=0mAtpPoNoAEd&format=png&color=000000',
              }}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
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
          tabBarIcon: ({ color }) => (
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=100&id=GqJpEbXPcmLg&format=png&color=000000',
              }}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
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
          tabBarIcon: ({ color }) => (
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=100&id=40JxrZB76JLv&format=png&color=000000',
              }}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="acount"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=100&id=p8UFrp2VUgHR&format=png&color=000000',
              }}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
