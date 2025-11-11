import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { getFriends, subscribeUsers, type User } from '@/lib/users-store';
import { getCompetitions } from '@/lib/competitions-store';

type FriendWithTotal = User & { totalCo2: number };

function computeTotals(): FriendWithTotal[] {
  const comps = getCompetitions();
  const friends = getFriends();
  const totals: Record<string, number> = {};
  for (const c of comps) {
    for (const p of c.participants) {
      totals[p.id] = (totals[p.id] ?? 0) + p.co2ReducedKg;
    }
  }
  return friends
    .map((f) => ({ ...f, totalCo2: totals[f.id] ?? 0 }))
    .sort((a, b) => b.totalCo2 - a.totalCo2);
}

export default function FriendsScreen() {
  const [data, setData] = useState<FriendWithTotal[]>(computeTotals());

  useEffect(() => {
    const unsub = subscribeUsers(() => setData(computeTotals()));
    return unsub;
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Vänner' }} />
      <FlatList
        data={data}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/(tabs)/acount/friend/[id]', params: { id: item.id } }} asChild>
            <TouchableOpacity style={styles.row} accessibilityLabel={`Visa profil för ${item.name}`}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.main}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.user}>@{item.username}</Text>
            </View>
            <Text style={styles.co2}>{item.totalCo2.toFixed(1)} kg</Text>
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a7c7a3' },
  listContent: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2f7147',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  main: { flex: 1 },
  name: { fontWeight: '700', color: '#1f1f1f' },
  user: { color: '#2a2a2a', fontSize: 12 },
  co2: { fontWeight: '700', color: '#1f1f1f' },
});


