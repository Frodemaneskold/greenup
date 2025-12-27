import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { getCompetitionById, subscribe, type Competition } from '@/lib/competitions-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/icon-symbol';

const currentUserId = 'me';

export default function CompetitionDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [competition, setCompetition] = useState<Competition | undefined>(() =>
    id ? getCompetitionById(id) : undefined
  );
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const unsub = subscribe(() => {
      if (typeof id === 'string') {
        setCompetition(getCompetitionById(id));
      }
    });
    return unsub;
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      if (typeof id === 'string') {
        setCompetition(getCompetitionById(id));
      }
      setRefreshing(false);
    }, 500);
  }, [id]);

  const sorted = useMemo(() => {
    const participants = competition?.participants ?? [];
    return [...participants].sort((a, b) => b.co2ReducedKg - a.co2ReducedKg);
  }, [competition]);

  const renderItem = ({ item, index }: { item: NonNullable<Competition>['participants'][number]; index: number }) => {
    const isMe = item.id === currentUserId;
    return (
      <View style={[styles.row, isMe && styles.meRow]}>
        <Text style={styles.rank}>{index + 1}</Text>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <Text style={[styles.name, isMe && styles.meName]}>{item.name}</Text>
        </View>
        <Text style={styles.points}>{item.co2ReducedKg.toFixed(1)} kg CO₂e</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: (typeof name === 'string' && name) ? name : competition?.name ?? `Tävling #${id || ''}`,
          headerRight: () =>
            typeof id === 'string' ? (
              <Link href={{ pathname: '/(tabs)/leaderboard/competition/[id]/invite', params: { id } }} asChild>
                <TouchableOpacity style={styles.headerBtnIcon} accessibilityLabel="Bjud in deltagare">
                  <IconSymbol name="person.badge.plus" size={18} color="#fff" />
                </TouchableOpacity>
              </Link>
            ) : null,
        }}
      />
      {sorted.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Inga deltagare ännu</Text>
          <Text style={styles.emptyText}>Bjud in vänner för att komma igång.</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: insets.top + 56,
              paddingBottom: 100 + insets.bottom + tabBarHeight,
            },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
  },
  meRow: {
    borderWidth: 2,
    borderColor: '#2f7147',
  },
  rank: {
    width: 24,
    textAlign: 'center',
    fontWeight: '700',
    color: '#1f1f1f',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2f7147',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  name: {
    fontWeight: '600',
    color: '#1f1f1f',
  },
  meName: {
    textDecorationLine: 'underline',
  },
  points: {
    fontWeight: '600',
    color: '#1f1f1f',
  },
  headerBtnIcon: {
    backgroundColor: '#2f7147',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#1f1f1f',
    fontSize: 18,
    marginBottom: 6,
  },
  emptyText: {
    color: '#2a2a2a',
  },
});


