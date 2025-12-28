import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { setToken } from '@/lib/session';
import { updateCurrentUser } from '@/lib/users-store';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedUser = username.trim();
      const trimmedEmail = email.trim();
      if (!trimmedFirst) {
        Alert.alert('Förnamn krävs');
        return;
      }
      if (!trimmedLast) {
        Alert.alert('Efternamn krävs');
        return;
      }
      if (!trimmedUser) {
        Alert.alert('Användarnamn krävs');
        return;
      }
      if (!/^[a-zA-Z0-9_.]{3,}$/.test(trimmedUser)) {
        Alert.alert('Ogiltigt användarnamn', 'Minst 3 tecken. Tillåtna: a-ö, siffror, _ och .');
        return;
      }
      if (!trimmedEmail) {
        Alert.alert('E-post krävs');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        Alert.alert('Ogiltig e-postadress');
        return;
      }
      if (!password) {
        Alert.alert('Lösenord krävs');
        return;
      }
      // Skapa användare i Supabase Auth. `profiles`-posten skapas automatiskt via DB-trigger efter signup.
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username: trimmedUser,
            first_name: trimmedFirst,
            last_name: trimmedLast,
          },
        },
      });
      if (error) {
        Alert.alert('Fel', error.message);
        return;
      }
      // Om e-postverifiering är avstängd kan session finnas direkt -> navigera till profil.
      if (data.session) {
        if (data.session.access_token) {
          await setToken(data.session.access_token);
        }
        updateCurrentUser({
          name: [trimmedFirst, trimmedLast].filter(Boolean).join(' ') || trimmedUser,
          username: trimmedUser,
        });
        router.replace('/(tabs)/acount');
        return;
      }
      // För projekt där verifiering är avstängd men ingen session returneras, försök logga in direkt.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (!signInError) {
        if (signInData.session?.access_token) {
          await setToken(signInData.session.access_token);
        }
        updateCurrentUser({
          name: [trimmedFirst, trimmedLast].filter(Boolean).join(' ') || trimmedUser,
          username: trimmedUser,
        });
        router.replace('/(tabs)/acount');
        return;
      }
      // Om verifiering krävs får användaren mail – be dem logga in efter att ha verifierat.
      Alert.alert('Verifiering skickad', 'Kolla din e-post för att bekräfta kontot. Logga in efter verifiering.');
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Skapa konto' }} />
      <View style={styles.card}>
        <Text style={styles.label}>Förnamn</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Förnamn"
          style={styles.input}
        />
        <Text style={styles.label}>Efternamn</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Efternamn"
          style={styles.input}
        />
        <Text style={styles.label}>Användarnamn</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="t.ex. frode"
          autoCapitalize="none"
          style={styles.input}
        />
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
          placeholder="••••••"
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity onPress={onSubmit} style={styles.primaryBtn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Skapa konto</Text>}
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


