import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getUserById } from '@/lib/users-store';

function weeksSince(dateIso: string): number {
  const created = new Date(dateIso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - created);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
}

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = typeof id === 'string' ? getUserById(id) : undefined;

  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Profil' }} />
        <Text style={styles.missing}>Kunde inte hitta profilen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Profil' }} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{user.friendsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Vänner</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{weeksSince(user.createdAt)}</Text>
          <Text style={styles.statLabel}>Tid i appen (v)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a7c7a3', padding: 16 },
  missing: { color: '#1f1f1f' },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2f7147',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 28 },
  name: { fontSize: 18, fontWeight: '700', color: '#1f1f1f' },
  username: { color: '#2a2a2a' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontWeight: '700', fontSize: 18, color: '#1f1f1f' },
  statLabel: { color: '#2a2a2a', marginTop: 4 },
});


