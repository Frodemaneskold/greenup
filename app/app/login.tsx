import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { setToken } from '@/lib/session';
import { updateCurrentUser } from '@/lib/users-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        Alert.alert('E-post krävs');
        return;
      }
      if (!password) {
        Alert.alert('Lösenord krävs');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        Alert.alert('Fel', error.message);
        return;
      }
      // Spara access token för appens "är inloggad"-logik
      if (data.session?.access_token) {
        await setToken(data.session.access_token);
      }
      // Uppdatera lokalt användarobjekt för att visa namn/användarnamn på profilsidan
      const userRes = await supabase.auth.getUser();
      const meta = userRes.data.user?.user_metadata ?? {};
      const first = typeof meta.first_name === 'string' ? meta.first_name : '';
      const last = typeof meta.last_name === 'string' ? meta.last_name : '';
      const name = [first, last].filter(Boolean).join(' ') || trimmedEmail.split('@')[0];
      const uname = typeof meta.username === 'string' ? meta.username : trimmedEmail.split('@')[0];
      updateCurrentUser({ name, username: uname });
      // Navigera direkt till profilsidan
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
                 const canGoBack = (router as any)?.canGoBack;
                 if (typeof canGoBack === 'function' && canGoBack()) {
                  router.back();
                } else {
                   router.replace('/(tabs)/acount');
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
        <Text style={styles.label}>E-post</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="din@mail.se"
          autoCapitalize="none"
          keyboardType="email-address"
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


