import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategories, getTodayCount, incrementAction, subscribeActions, type CategoryGroup } from '@/lib/actions-store';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [categories] = useState<CategoryGroup[]>(getCategories());
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    handlingar: false,
    mat: false,
    transport: false,
  });
  const [countsMap, setCountsMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    getCategories().forEach((cat) => {
      cat.actions.forEach((a) => {
        initial[a.id] = getTodayCount(a.id);
      });
    });
    return initial;
  });

  useEffect(() => {
    const unsub = subscribeActions(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  const onDo = (actionId: string) => {
    incrementAction(actionId);
    const fresh = getTodayCount(actionId);
    // Update local counts map immediately for instant UI feedback
    setCountsMap((prev) => ({ ...prev, [actionId]: fresh }));
    setTick((t) => t + 1);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 16 + insets.top, paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Skapa</Text>

        {categories.map((cat) => (
          <View key={cat.id} style={styles.section}>
            <TouchableOpacity
              onPress={() => toggle(cat.id)}
              style={styles.sectionHeader}
              accessibilityLabel={`Växla ${cat.title}`}
            >
              <Text style={styles.sectionTitle}>{cat.title}</Text>
              <IconSymbol
                name="chevron.down"
                size={16}
                color="#1f1f1f"
                style={{ transform: [{ rotate: expanded[cat.id] ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            {expanded[cat.id] &&
              cat.actions.map((a) => {
              const count = countsMap[a.id] ?? getTodayCount(a.id);
                const percent = Math.min(100, Math.round((count / 3) * 100));
                const disabled = count >= 3;
                return (
                  <View key={a.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardName}>{a.name}</Text>
                      <Text style={styles.cardCount}>Idag: {count} / 3</Text>
                    </View>
                    {a.description ? <Text style={styles.cardDesc}>{a.description}</Text> : null}
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percent}%` }]} />
                    </View>
                    <TouchableOpacity
                      onPress={() => onDo(a.id)}
                      style={[styles.doBtn, disabled && styles.doBtnDisabled]}
                      disabled={disabled}
                      accessibilityLabel={`Utför ${a.name}`}
                    >
                      <Text style={styles.doBtnText}>{disabled ? 'Max utförd idag' : 'Gör'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 4,
  },
  section: {
    gap: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1f1f1f',
    fontSize: 16,
    marginBottom: 0,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardName: {
    fontWeight: '700',
    color: '#1f1f1f',
    fontSize: 16,
  },
  cardCount: {
    color: '#2a2a2a',
    fontSize: 12,
  },
  cardDesc: {
    color: '#2a2a2a',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2f7147',
  },
  doBtn: {
    backgroundColor: '#2f7147',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  doBtnDisabled: {
    opacity: 0.6,
  },
  doBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});


