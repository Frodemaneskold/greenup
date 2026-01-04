import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import HomeBg from '@/assets/images/home-bg.svg';
import { getCompetitions } from '@/lib/competitions-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { fetchMyTotalCo2Saved, fetchAllUsersTotalCo2Saved, subscribeCo2TotalUpdated } from '@/src/services/missions';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [co2Saved, setCo2Saved] = useState<number | null>(null);
  const [allSaved, setAllSaved] = useState<number | null>(null);
  const { myTotal, allTotal } = useMemo(() => {
    const comps = getCompetitions();
    let my = 0;
    const perUser: Record<string, number> = {};
    for (const c of comps) {
      for (const p of c.participants) {
        if (p.id === 'me') {
          my += p.co2ReducedKg;
        }
        // Summera per unik användare (tar högsta värde per användare över tävlingar)
        perUser[p.id] = Math.max(perUser[p.id] ?? 0, p.co2ReducedKg);
      }
    }
    const all = Object.values(perUser).reduce((sum, v) => sum + v, 0);
    return { myTotal: my, allTotal: all };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let unsubLocal: (() => void) | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let channelAll: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      try {
        // Initial load from Supabase aggregated total
        const total = await fetchMyTotalCo2Saved();
        setCo2Saved(total);
        const all = await fetchAllUsersTotalCo2Saved();
        setAllSaved(all);
      } catch {
        // ignore; will fall back to local calc
      }
      // Local pub/sub as a fallback to update immediately after logging an action
      unsubLocal = subscribeCo2TotalUpdated(async () => {
        const latest = await fetchMyTotalCo2Saved();
        setCo2Saved(latest);
        const all = await fetchAllUsersTotalCo2Saved();
        setAllSaved(all);
      });
      // Subscribe to realtime inserts to update total immediately after missions are logged
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      channel = supabase
        .channel('realtime:my_user_actions_total')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_actions', filter: `user_id=eq.${userId}` },
          async () => {
            const latest = await fetchMyTotalCo2Saved();
            setCo2Saved(latest);
          }
        )
        .subscribe();
      // Optional: listen to all inserts to update global total
      channelAll = supabase
        .channel('realtime:all_user_actions_total')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_actions' }, async () => {
          const all = await fetchAllUsersTotalCo2Saved();
          setAllSaved(all);
        })
        .subscribe();
      unsub = () => {
        if (channel) supabase.removeChannel(channel);
        if (channelAll) supabase.removeChannel(channelAll);
      };
    })();
    return () => {
      if (unsub) unsub();
      if (unsubLocal) unsubLocal();
      if (channel) supabase.removeChannel(channel);
      if (channelAll) supabase.removeChannel(channelAll);
    };
  }, []);

  return (
    <View style={styles.screen}>
      <HomeBg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice" />
      <View style={[styles.container, { paddingTop: insets.top + 56 }]}>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Din minskning</Text>
            <Text style={styles.cardValue}>{((co2Saved ?? myTotal)).toFixed(1)} kg CO₂e</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Allas minskning</Text>
            <Text style={styles.cardValue}>{((allSaved ?? allTotal)).toFixed(1)} kg CO₂e</Text>
          </View>
        </View>

        <Link href="/(tabs)/create" asChild>
          <TouchableOpacity style={styles.primaryBtn} accessibilityLabel="Gå till Skapa">
            <Text style={styles.primaryBtnText}>Skapa</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
  },
  headerBtn: {
    backgroundColor: '#2f7147',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cards: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    color: '#2a2a2a',
    marginBottom: 6,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  primaryBtn: {
    backgroundColor: '#2f7147',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
