import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TouchableOpacity, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitleStyle: { color: '#1f1f1f' },
          headerTintColor: '#1f1f1f',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{
            title: 'Logga in',
            headerBackVisible: false,
            gestureEnabled: false,
            headerLeft: () => (
              <Link href="/" asChild>
                <TouchableOpacity accessibilityLabel="Gå till Hem" style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: '#1f1f1f', fontWeight: '600' }}>{'< Hem'}</Text>
                </TouchableOpacity>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="register" options={{ title: 'Skapa konto' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
