import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import HomeBg from '@/assets/images/home-bg.svg';
import { getCompetitions } from '@/lib/competitions-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMe } from '@/lib/api';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [co2Saved, setCo2Saved] = useState<number | null>(null);
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
    (async () => {
      try {
        const me = await getMe();
        setCo2Saved(me.total_co2_saved ?? 0);
      } catch {
        // not logged in; keep null to fall back to local calc
      }
    })();
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
            <Text style={styles.cardValue}>{allTotal.toFixed(1)} kg CO₂e</Text>
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
