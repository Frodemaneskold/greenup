import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { login as loginApi } from '@/lib/api';
import { setToken } from '@/lib/session';
import { updateCurrentUser } from '@/lib/users-store';

export default function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('12345');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      const { token } = await loginApi(username.trim(), password);
      await setToken(token);
      updateCurrentUser({ username, name: username });
      router.replace('/(tabs)/acount');
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Logga in',
          headerLeft: () => (
            <TouchableOpacity
              accessibilityLabel="Tillbaka"
              onPress={() => {
                // Gå tillbaka om möjligt, annars hemfliken
                // @ts-expect-error canGoBack exists in expo-router at runtime
                if (typeof router.canGoBack === 'function' && router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 16 }}>‹ Tillbaka</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.card}>
        <Text style={styles.label}>Användarnamn</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="admin"
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.label}>Lösenord</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity onPress={onSubmit} style={styles.primaryBtn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Logga in</Text>}
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 12 }}>
        <TouchableOpacity onPress={() => router.push('/register')} accessibilityLabel="Skapa konto">
          <Text style={{ color: '#2f7147', fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline', fontSize: 16 }}>
            Skapa konto
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a7c7a3', padding: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 16 },
  label: { color: '#2a2a2a', marginTop: 8, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e5e5' },
  primaryBtn: { marginTop: 16, backgroundColor: '#2f7147', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});


