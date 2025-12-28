import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Pressable, Image, RefreshControl, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchMissions, fetchTodayCounts, logUserAction, type Mission } from '@/src/services/missions';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    transport: false,
    mat: false,
    'återvinning': false,
    konsumtion: false,
    hem: false,
  });
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});

  const CATEGORIES = useMemo(
    () => [
      { key: 'transport', label: 'Transport' },
      { key: 'mat', label: 'Mat' },
      { key: 'återvinning', label: 'Återvinning' },
      { key: 'konsumtion', label: 'Konsumtion' },
      { key: 'hem', label: 'Hem' },
    ] as const,
    []
  );

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Mission[]> = {};
    for (const c of CATEGORIES) {
      groups[c.key] = [];
    }
    // Helper: normalize incoming DB category to one of our static keys
    const sanitize = (v: string) =>
      v
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // strip diacritics
    const normalizeKey = (raw: string): typeof CATEGORIES[number]['key'] | null => {
      const s = sanitize(raw);
      // direct matches to our keys
      if (s === 'transport') return 'transport';
      if (s === 'mat' || s === 'food' || s === 'kost') return 'mat';
      if (s === 'atervinning' || s === 'recycling') return 'återvinning';
      if (s === 'konsumtion' || s === 'consumption' || s === 'shopping' || s === 'inkop' || s === 'inköp')
        return 'konsumtion';
      if (s === 'hem' || s === 'home' || s === 'household' || s === 'bostad') return 'hem';
      // attempt exact diacritic form (if DB happens to use it)
      if (raw === 'återvinning') return 'återvinning';
      // unknown -> null (we will optionally fall back)
      return null;
    };
    for (const m of missions) {
      const key = normalizeKey(m.category) ?? 'konsumtion'; // fallback to a visible category
      groups[key].push(m);
    }
    return groups;
  }, [missions, CATEGORIES]);

  const openConfirm = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const confirmDo = async () => {
    if (!selectedMission) return;
    const current = countsMap[selectedMission.id] ?? 0;
    const max = Math.max(0, selectedMission.max_per_day ?? 0);
    if (current >= max) {
      Alert.alert('Gräns nådd', 'Du har nått max för idag.');
      setSelectedMission(null);
      return;
    }
    try {
      await logUserAction(selectedMission);
      setCountsMap((prev) => ({ ...prev, [selectedMission.id]: (prev[selectedMission.id] ?? 0) + 1 }));
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte logga handlingen.');
    }
    setSelectedMission(null);
  };

  const closeConfirm = () => {
    setSelectedMission(null);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = async () => {
    try {
      const list = await fetchMissions();
      setMissions(list);
      const ids = list.map((m) => m.id);
      const counts = await fetchTodayCounts(ids);
      setCountsMap(counts);
    } catch (e: any) {
      // Surface a helpful error so it's clear why categories are empty
      Alert.alert('Fel vid hämtning', e?.message ?? 'Kunde inte hämta uppdrag. Kontrollera anslutning och behörigheter.');
      setMissions([]);
      setCountsMap({});
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/Vandring.png')}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {CATEGORIES.map((cat) => (
          <View key={cat.key} style={styles.section}>
            <TouchableOpacity
              onPress={() => toggle(cat.key)}
              style={styles.sectionHeader}
              accessibilityLabel={`Växla ${cat.label}`}
            >
              <Text style={styles.sectionTitle}>{cat.label}</Text>
              <IconSymbol
                name="chevron.down"
                size={16}
                color="#1f1f1f"
                style={{ transform: [{ rotate: expanded[cat.key] ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            {expanded[cat.key] &&
              (groupedByCategory[cat.key]?.length
                ? groupedByCategory[cat.key].map((m) => {
                    const count = countsMap[m.id] ?? 0;
                    const max = Math.max(1, m.max_per_day ?? 1);
                    const percent = Math.min(100, Math.round((count / max) * 100));
                    const disabled = count >= max;
                    return (
                      <View key={m.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardName}>{m.title}</Text>
                          <Text style={styles.cardCount}>Idag: {count} / {max}</Text>
                        </View>
                        {m.description ? <Text style={styles.cardDesc}>{m.description}</Text> : null}
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${percent}%` }]} />
                        </View>
                        <TouchableOpacity
                          onPress={() => openConfirm(m)}
                          style={[styles.doBtn, disabled && styles.doBtnDisabled]}
                          disabled={disabled}
                          accessibilityLabel={`Utför ${m.title}`}
                        >
                          <Text style={styles.doBtnText}>{disabled ? 'Max utförd idag' : 'Gör'}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                : (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>Inga uppdrag ännu.</Text>
                  </View>
                ))}
          </View>
        ))}
      </ScrollView>

      {selectedMission && (
        <View style={styles.modalWrap} pointerEvents="box-none">
          <BlurView
            intensity={35}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCenter} pointerEvents="box-none">
            <Pressable style={styles.modalCard} accessibilityRole="dialog" accessibilityLabel={selectedMission.title}>
              <Text style={styles.modalTitle}>{selectedMission.title}</Text>
              <View style={styles.modalIllustration}>
                <Image
                  source={require('@/assets/images/Pantbild.png')}
                  style={styles.modalIllustrationImg}
                  resizeMode="cover"
                  accessible
                  accessibilityLabel="Illustration för Panta"
                />
              </View>
              <Text style={styles.modalText}>
                {selectedMission.description ??
                  'Att panta sparar energi och minskar behovet av nya råvaror. Fortsätt bidra!'}
              </Text>
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={closeConfirm} style={[styles.modalBtn, styles.modalCancel]}>
                  <Text style={styles.modalBtnCancelText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDo} style={[styles.modalBtn, styles.modalPrimary]}>
                  <Text style={styles.modalBtnText}>Gör</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
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
  emptyWrap: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#2a2a2a',
    fontStyle: 'italic',
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
  modalWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  modalCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '92%',
    maxWidth: 560,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalIllustration: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  modalIllustrationImg: {
    width: '100%',
    height: '100%',
  },
  modalText: {
    color: '#2a2a2a',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: '#e53935',
    minWidth: 96,
  },
  modalPrimary: {
    backgroundColor: '#2f7147',
    flex: 1,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBtnCancelText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
});


