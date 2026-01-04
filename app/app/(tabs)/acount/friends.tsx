import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { type User } from '@/lib/users-store';
import { getCompetitions } from '@/lib/competitions-store';
import { supabase } from '@/src/lib/supabase';

type FriendWithTotal = User & { totalCo2: number };

function computeTotals(friends: User[]): FriendWithTotal[] {
  const comps = getCompetitions();
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
  const [friends, setFriends] = useState<User[]>([]);
  const data = useMemo(() => computeTotals(friends), [friends]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: me } = await supabase.auth.getUser();
      const myId = me?.user?.id;
      if (!myId) return;
      async function load() {
        // Hämta accepterade relationer där jag är med
        const { data: rels, error } = await supabase
          .from('friend_requests')
          .select('from_user_id, to_user_id, status')
          .eq('status', 'accepted')
          .or(`from_user_id.eq.${myId},to_user_id.eq.${myId}`);
        if (error) return;
        const otherIds = Array.from(
          new Set(
            (rels ?? []).map((r: any) => (r.from_user_id === myId ? r.to_user_id : r.from_user_id))
          )
        );
        if (otherIds.length === 0) {
          setFriends([]);
          return;
        }
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, full_name, first_name, last_name, email')
          .in('id', otherIds);
        const mapped: User[] =
          (profs ?? []).map((p: any) => {
            const fullName =
              p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(' ') ||
              p.username ||
              (p.email ?? 'user').split('@')[0];
            return {
              id: p.id,
              name: fullName,
              username: p.username ?? (p.email ?? 'user').split('@')[0],
              email: p.email ?? '',
              createdAt: new Date().toISOString().slice(0, 10),
            } as User;
          }) ?? [];
        setFriends(mapped);
      }
      await load();
      // Realtime: uppdatera när relationer ändras
      channel = supabase
        .channel('realtime:friends_list:' + myId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friend_requests', filter: `to_user_id=eq.${myId}` },
          load
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friend_requests', filter: `from_user_id=eq.${myId}` },
          load
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Vänner' }} />
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {friends.length > 0 ? (
          <Text style={styles.subTitle}>
            Du har {friends.length} {friends.length === 1 ? 'vän' : 'vänner'}
          </Text>
        ) : (
          <Text style={styles.subTitle}>Du har ännu inga vänner.</Text>
        )}
      </View>
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
              <Text style={styles.user}>@{item.username} • Vän</Text>
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
  subTitle: { color: '#1f1f1f' },
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


