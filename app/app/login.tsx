import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { setToken } from '@/lib/session';
import { updateCurrentUser } from '@/lib/users-store';
import { useFocusEffect } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Om användaren trycker Androids back-knapp på login -> gå till Hem
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/');
        return true;
      });
      return () => sub.remove();
    }, [])
  );

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
      const authUser = userRes.data.user;
      // Autofix: säkerställ att profiles har ett username (unikt, lowercase)
      try {
        if (authUser?.id) {
          const meId = authUser.id;
          const emailLower = (authUser.email ?? '').toLowerCase();
          const baseMeta = typeof meta.username === 'string' ? meta.username.trim().toLowerCase() : '';
          let candidate = baseMeta || (emailLower ? emailLower.split('@')[0] : '');
          if (!candidate) candidate = 'user';
          // Läs befintlig profil
          let hasUsername = false;
          try {
            const { data: prof } = await supabase.from('profiles').select('username').eq('id', meId).single();
            hasUsername = !!(prof && (prof as any).username);
          } catch {
            // om single() felar, fortsätt och försök skriva
          }
          if (!hasUsername) {
            // Kolla snabb konflikt (case-insensitivt)
            const { data: taken } = await supabase
              .from('profiles')
              .select('id')
              .ilike('username', candidate)
              .limit(1);
            let usernameToUse = candidate;
            if ((taken ?? []).some((r) => r.id !== meId)) {
              usernameToUse = `${candidate}_${Math.random().toString(36).slice(2, 6)}`;
            }
            await supabase
              .from('profiles')
              .upsert(
                {
                  id: meId,
                  email: emailLower || null,
                  username: usernameToUse,
                },
                { onConflict: 'id' }
              );
          }
        }
      } catch {
        // ignorera tyst; DB-constraint/trigger kan också hantera
      }
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
                router.replace('/');
              }}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 16 }}>‹ Hem</Text>
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


