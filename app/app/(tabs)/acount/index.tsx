import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCompetitions } from '@/lib/competitions-store';
import { getCurrentUser, getFriends, subscribeUsers, type User } from '@/lib/users-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FriendWithTotal = User & { totalCo2: number };

function weeksSince(dateIso: string): number {
  const created = new Date(dateIso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - created);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
}

function computeFriendTotals(): FriendWithTotal[] {
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

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState(getCurrentUser());
  const [friends, setFriends] = useState<FriendWithTotal[]>(computeFriendTotals());

  useEffect(() => {
    const unsub = subscribeUsers(() => {
      setMe(getCurrentUser());
      setFriends(computeFriendTotals());
    });
    return () => {
      unsub();
    };
  }, []);

  const top3 = useMemo(() => friends.slice(0, 3), [friends]);

  return (
    <View style={[styles.container, { paddingTop: 16 + insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Profil',
          headerRight: () => (
            <Link href="/(tabs)/acount/settings" asChild>
              <TouchableOpacity style={styles.headerBtn} accessibilityLabel="Profilinställningar">
                <IconSymbol name="gearshape.fill" size={18} color="#fff" />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{me.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{me.name}</Text>
        <Text style={styles.username}>@{me.username}</Text>
      </View>

      <View style={styles.statsRow}>
        <Link href="/(tabs)/acount/friends" asChild>
          <TouchableOpacity style={styles.statBox} accessibilityLabel="Visa vänner">
            <Text style={styles.statNumber}>{getFriends().length}</Text>
            <Text style={styles.statLabel}>Vänner</Text>
          </TouchableOpacity>
        </Link>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{weeksSince(me.createdAt)}</Text>
          <Text style={styles.statLabel}>Tid i appen (v)</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vänner (topp 3)</Text>
        <Link href="/(tabs)/acount/friends" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>Visa alla</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {top3.length === 0 ? (
        <Text style={styles.emptyText}>Inga vänner ännu. Lägg till en ny vän!</Text>
      ) : (
        <View style={styles.listContent}>
          {top3.map((item) => (
            <Link key={item.id} href={{ pathname: '/(tabs)/acount/friend/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity style={styles.friendRow} accessibilityLabel={`Visa profil för ${item.name}`}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.friendMain}>
                <Text style={styles.friendName}>{item.name}</Text>
                <Text style={styles.friendUser}>@{item.username}</Text>
              </View>
              <Text style={styles.friendCo2}>{item.totalCo2.toFixed(1)} kg</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      )}

      <Link href="/(tabs)/acount/search" asChild>
        <TouchableOpacity style={styles.newFriendBtn} accessibilityLabel="Ny vän">
          <IconSymbol name="person.badge.plus" size={18} color="#fff" />
          <Text style={styles.newFriendText}>Ny vän</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
    paddingHorizontal: 16,
  },
  headerBtn: {
    backgroundColor: '#2f7147',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 54,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2f7147',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 32,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  username: {
    color: '#2a2a2a',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    fontSize: 18,
    color: '#1f1f1f',
  },
  statLabel: {
    color: '#2a2a2a',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1f1f1f',
    fontSize: 16,
  },
  emptyText: {
    color: '#1f1f1f',
    marginTop: 8,
    marginBottom: 8,
  },
  linkText: {
    color: '#1f1f1f',
    textDecorationLine: 'underline',
  },
  listContent: {
    marginTop: 8,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2f7147',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  friendAvatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  friendMain: {
    flex: 1,
  },
  friendName: {
    fontWeight: '700',
    color: '#1f1f1f',
  },
  friendUser: {
    color: '#2a2a2a',
    fontSize: 12,
  },
  friendCo2: {
    fontWeight: '700',
    color: '#1f1f1f',
  },
  newFriendBtn: {
    marginTop: 8,
    backgroundColor: '#2f7147',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newFriendText: {
    color: '#fff',
    fontWeight: '700',
  },
});


