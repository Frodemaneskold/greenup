import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { fetchNotifications, markNotificationRead, subscribeToNotifications, type NotificationRow } from '@/src/services/notifications';
import { acceptInvite as acceptDbInvite, declineInvite as declineDbInvite } from '@/src/services/invites';
import { loadCompetitionsFromSupabase } from '@/lib/competitions-store';

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const ok = !!data?.user?.id;
      setLoggedIn(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      try {
        const rows = await fetchNotifications();
        setItems(rows);
      } catch (e: any) {
        Alert.alert('Kunde inte hämta notiser', e?.message ?? 'Försök igen senare.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    const unsub = subscribeToNotifications((row) => {
      setItems((prev) => [row, ...prev]);
    });
    return () => { unsub(); };
  }, [loggedIn]);

  const onRefresh = useCallback(() => {
    if (!loggedIn) return;
    setRefreshing(true);
    (async () => {
      try {
        const rows = await fetchNotifications();
        setItems(rows);
      } catch (e: any) {
        Alert.alert('Kunde inte uppdatera notiser', e?.message ?? 'Försök igen senare.');
      } finally {
        setRefreshing(false);
      }
    })();
  }, [loggedIn]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notiser' }} />
      {!loggedIn ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Logga in för att se notiser.</Text>
        </View>
      ) : loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Laddar...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Inga notiser just nu.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const unread = !item.read_at;
            const created = new Date(item.created_at).toLocaleString();
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={async () => {
                  if (item.type === 'competition_invite' && item.metadata && (item.metadata as any).invite_id) {
                    const inviteId = (item.metadata as any).invite_id as string;
                    const compId = (item.metadata as any).competition_id as string | undefined;
                    Alert.alert(
                      'Inbjudan',
                      'Vill du gå med i tävlingen?',
                      [
                        {
                          text: 'Avböj',
                          style: 'cancel',
                          onPress: async () => {
                            try {
                              await declineDbInvite(inviteId);
                              await markNotificationRead(item.id);
                              setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)));
                            } catch (e: any) {
                              Alert.alert('Fel', e?.message ?? 'Kunde inte avböja.');
                            }
                          },
                        },
                        {
                          text: 'Acceptera',
                          style: 'default',
                          onPress: async () => {
                            try {
                              await acceptDbInvite(inviteId);
                              await markNotificationRead(item.id);
                              setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)));
                              await loadCompetitionsFromSupabase();
                              Alert.alert('Klart', 'Du har gått med i tävlingen.');
                            } catch (e: any) {
                              Alert.alert('Fel', e?.message ?? 'Kunde inte acceptera.');
                            }
                          },
                        },
                      ],
                      { cancelable: true }
                    );
                  } else {
                    // Standard: markera som läst
                    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
                    try {
                      await markNotificationRead(item.id);
                    } catch (e: any) {
                      Alert.alert('Kunde inte markera som läst', e?.message ?? 'Försök igen senare.');
                    }
                  }
                }}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.type}
                  </Text>
                </View>
                <View style={styles.main}>
                  <Text style={[styles.title, unread && styles.unread]}>{item.title}</Text>
                  {item.body ? <Text style={styles.msg}>{item.body}</Text> : null}
                  <Text style={styles.date}>{created}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a7c7a3' },
  listContent: { padding: 16 },
  row: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#2f7147',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  main: { flex: 1 },
  title: { fontWeight: '700', color: '#1f1f1f' },
  unread: { textDecorationLine: 'underline' },
  msg: { color: '#2a2a2a', marginTop: 2 },
  date: { color: '#2a2a2a', marginTop: 4, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  accept: { backgroundColor: '#2f7147' },
  decline: { backgroundColor: '#b83a3a' },
  actionText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#1f1f1f' },
});


