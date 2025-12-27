import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { isValidEmail, isValidUsername, type User } from '@/lib/users-store';
import { addFriendRequestNotification } from '@/lib/notifications-store';

export default function SearchFriendScreen() {
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onAdd = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      Alert.alert('Ange e‑post eller användarnamn');
      return;
    }
    let newFriend: User | null = null;
    if (isValidEmail(trimmed)) {
      const base = trimmed.split('@')[0];
      newFriend = {
        id: `u-${Math.random().toString(36).slice(2, 7)}`,
        name: base.charAt(0).toUpperCase() + base.slice(1),
        username: base.toLowerCase(),
        email: trimmed.toLowerCase(),
        createdAt: new Date().toISOString().slice(0, 10),
      };
    } else if (isValidUsername(trimmed)) {
      const base = trimmed.replace(/^@/, '');
      newFriend = {
        id: `u-${Math.random().toString(36).slice(2, 7)}`,
        name: base.charAt(0).toUpperCase() + base.slice(1),
        username: base.toLowerCase(),
        email: `${base.toLowerCase()}@example.com`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
    }
    if (!newFriend) {
      Alert.alert('Ogiltig input', 'Skriv en giltig e‑post eller ett användarnamn.');
      return;
    }
    setSubmitting(true);
    try {
      // Skicka vänförfrågan som notis till mottagaren (demo: visas i vår notisskärm)
      addFriendRequestNotification({ id: newFriend.id, username: newFriend.username, name: newFriend.name });
      Alert.alert('Vänförfrågan skickad', `@${newFriend.username} har fått en förfrågan.`);
      setQuery('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Sök ny vän' }} />
      <View style={styles.card}>
        <Text style={styles.label}>Sök på användarnamn eller e‑post</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="@anvandarnamn eller namn@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TouchableOpacity style={[styles.button, submitting && styles.disabled]} onPress={onAdd} disabled={submitting}>
          <Text style={styles.buttonText}>Skicka vänförfrågan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a7c7a3', padding: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
  },
  label: { fontWeight: '700', color: '#1f1f1f', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  button: {
    backgroundColor: '#2f7147',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
});


