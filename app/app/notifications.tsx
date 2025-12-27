import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { getNotifications, subscribeNotifications, type AppNotification, removeNotification } from '@/lib/notifications-store';
import { addFriend } from '@/lib/users-store';

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>(getNotifications());

  useEffect(() => {
    const unsub = subscribeNotifications(() => setItems(getNotifications()));
    return () => {
      unsub();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notiser' }} />
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Inga notiser just nu.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isFriendReq = item.type === 'friend_request' && item.payload?.fromUser;
            return (
              <View style={styles.row}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.type === 'friend_request' ? 'Vän' : item.type === 'activity' ? 'Akt' : 'Info'}
                  </Text>
                </View>
                <View style={styles.main}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.message ? <Text style={styles.msg}>{item.message}</Text> : null}
                  {isFriendReq ? (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.accept]}
                        onPress={() => {
                          const u = item.payload!.fromUser!;
                          addFriend({
                            id: u.id,
                            username: u.username,
                            name: u.name,
                            email: `${u.username}@example.com`,
                            createdAt: new Date().toISOString().slice(0, 10),
                          });
                          removeNotification(item.id);
                        }}
                      >
                        <Text style={styles.actionText}>Acceptera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.decline]}
                        onPress={() => removeNotification(item.id)}
                      >
                        <Text style={styles.actionText}>Avböj</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
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
  msg: { color: '#2a2a2a', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  accept: { backgroundColor: '#2f7147' },
  decline: { backgroundColor: '#b83a3a' },
  actionText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#1f1f1f' },
});


