import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategories, getTodayCount, incrementAction, subscribeActions, type CategoryGroup } from '@/lib/actions-store';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [categories] = useState<CategoryGroup[]>(getCategories());
  const [, setTick] = useState(0);
  const [selectedAction, setSelectedAction] = useState<{ id: string; name: string; description?: string } | null>(null);
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

  const openConfirm = (action: { id: string; name: string; description?: string }) => {
    setSelectedAction(action);
  };

  const confirmDo = () => {
    if (selectedAction) {
      onDo(selectedAction.id);
      setSelectedAction(null);
    }
  };

  const closeConfirm = () => {
    setSelectedAction(null);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
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
      >
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
                      onPress={() => openConfirm({ id: a.id, name: a.name, description: a.description })}
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

      {selectedAction && (
        <View style={styles.modalWrap} pointerEvents="box-none">
          <BlurView
            intensity={35}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCenter} pointerEvents="box-none">
            <Pressable style={styles.modalCard} accessibilityRole="dialog" accessibilityLabel={selectedAction.name}>
              <Text style={styles.modalTitle}>{selectedAction.name}</Text>
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
                {selectedAction.description ??
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


