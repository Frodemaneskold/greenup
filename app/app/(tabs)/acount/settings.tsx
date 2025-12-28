import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getCurrentUser, getFriends, isValidUsername, updateCurrentUser } from '@/lib/users-store';
import { clearToken } from '@/lib/session';
import { supabase } from '@/src/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function SettingsScreen() {
  const router = useRouter();
  const me = getCurrentUser();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const onSave = () => {
    const trimmedName = name.trim();
    const trimmedUser = username.trim();
    if (!trimmedName) {
      Alert.alert('Namn krävs');
      return;
    }
    if (!isValidUsername(trimmedUser)) {
      Alert.alert('Ogiltigt användarnamn', 'Minst 3 tecken, a-ö, siffror, _ eller .');
      return;
    }
    const exists = getFriends().some((f) => f.username.toLowerCase() === trimmedUser.toLowerCase());
    if (exists && trimmedUser.toLowerCase() !== me.username.toLowerCase()) {
      Alert.alert('Upptaget användarnamn', 'Välj ett annat unikt användarnamn.');
      return;
    }
    setSaving(true);
    try {
      updateCurrentUser({ name: trimmedName, username: trimmedUser });
      Alert.alert('Sparat');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Profilinställningar' }} />
      <View style={styles.card}>
        <Text style={styles.label}>Namn</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="För- och efternamn" />

        <Text style={styles.label}>Användarnamn</Text>
        <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="unikt_användarnamn" autoCapitalize="none" />

        <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={onSave} disabled={saving}>
          <Text style={styles.buttonText}>Spara</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Profilbildsuppdatering kan läggas till senare.</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        accessibilityLabel="Logga ut"
        onPress={async () => {
          await supabase.auth.signOut();
          await clearToken();
          router.replace('/login');
        }}
        style={[styles.logoutBtn, { marginBottom: 8 + insets.bottom + tabBarHeight }]}
      >
        <Text style={styles.logoutText}>Logga ut</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontWeight: '700',
    color: '#1f1f1f',
    marginTop: 8,
    marginBottom: 6,
  },
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
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  hint: {
    marginTop: 12,
    color: '#1f1f1f',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#b83a3a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
});


