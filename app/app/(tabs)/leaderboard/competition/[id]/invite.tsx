import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getFriends, isValidEmail, isValidUsername, subscribeUsers } from '@/lib/users-store';
import { getPendingInvitesForCompetition, subscribeInvites, acceptInvite, declineInvite } from '@/lib/invites-store';
import { subscribeFriendRequests } from '@/lib/friend-requests-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { supabase } from '@/src/lib/supabase';
import { createInvite as createDbInvite } from '@/src/services/invites';

type SelectableFriend = {
  id: string;
  name: string;
  username: string;
  email: string;
};

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friends, setFriends] = useState<SelectableFriend[]>(() => getFriends() as unknown as SelectableFriend[]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(() => (typeof id === 'string' ? getPendingInvitesForCompetition(id) : []));
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [idToProfile, setIdToProfile] = useState<Record<string, { name: string; username: string }>>({});

  React.useEffect(() => {
    const unsub = subscribeInvites(() => {
      if (typeof id === 'string') {
        setPending(getPendingInvitesForCompetition(id));
      }
    });
    const unsubUsers = subscribeUsers(() => {
      setFriends(getFriends() as unknown as SelectableFriend[]);
    });
    const unsubFriendReq = subscribeFriendRequests(() => {
      // no-op; subscribe triggers store refresh which cascades via subscribeUsers
    });
    return unsub;
  }, [id]);

  // Resolve profiles for pending invites targeting user ids (friends)
  React.useEffect(() => {
    (async () => {
      const ids = Array.from(
        new Set(
          pending
            .filter((p) => p.target.type === 'friend')
            .map((p) => (p.target as { type: 'friend'; userId: string }).userId)
        )
      ).filter(Boolean) as string[];
      if (ids.length === 0) {
        setIdToProfile({});
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name, username, email')
          .in('id', ids);
        const map: Record<string, { name: string; username: string }> = {};
        (data ?? []).forEach((row: any) => {
          const full =
            row.full_name ||
            [row.first_name, row.last_name].filter(Boolean).join(' ') ||
            row.username ||
            (row.email ?? 'user').split('@')[0];
          const uname = row.username || (row.email ?? 'user').split('@')[0];
          map[row.id as string] = { name: String(full), username: String(uname) };
        });
        setIdToProfile(map);
      } catch {
        // ignore
      }
    })();
  }, [pending]);

  const toggle = (userId: string) => {
    setSelected((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const onSendSelected = async () => {
    const friendIds = Object.keys(selected).filter((k) => selected[k]);
    if (friendIds.length === 0 || typeof id !== 'string') {
      Alert.alert('Välj minst en vän');
      return;
    }
    setSubmitting(true);
    try {
      let ok = 0;
      let fail = 0;
      let firstError: string | null = null;
      for (const userId of friendIds) {
        try {
          await createDbInvite(id, userId);
          ok++;
        } catch (e: any) {
          if (!firstError) firstError = e?.message ?? String(e);
          fail++;
        }
      }
      const base = `Skickade ${ok} inbjudning(ar)` + (fail ? `, misslyckades: ${fail}` : '');
      if (fail && firstError) {
        Alert.alert('Klar (med fel)', `${base}\n\nFel: ${firstError}`);
      } else {
        Alert.alert('Klar', base);
      }
      setSelected({});
    } catch (e) {
      Alert.alert('Något gick fel', 'Försök igen senare.');
    } finally {
      setSubmitting(false);
    }
  };

  const onInviteQuery = async () => {
    if (typeof id !== 'string') return;
    const trimmed = query.trim();
    if (!trimmed) {
      Alert.alert('Ange ett användarnamn eller en e‑postadress');
      return;
    }
    let userId: string | null = null;
    if (isValidEmail(trimmed)) {
      const { data } = await supabase.from('profiles').select('id').eq('email', trimmed).single();
      userId = (data as any)?.id ?? null;
    } else if (isValidUsername(trimmed)) {
      const { data } = await supabase.from('profiles').select('id').eq('username', trimmed).single();
      userId = (data as any)?.id ?? null;
    }
    if (!userId) {
      Alert.alert('Hittade inte användaren', 'Kontrollera stavning eller använd en giltig e‑post.');
      return;
    }
    setSubmitting(true);
    try {
      await createDbInvite(id, userId);
      Alert.alert('Inbjudan skickad', 'Notis skickas till användaren.');
      setQuery('');
    } catch (e) {
      Alert.alert('Något gick fel', 'Försök igen senare.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFriend = ({ item }: { item: SelectableFriend }) => {
    const checked = !!selected[item.id];
    return (
      <TouchableOpacity style={styles.friendRow} onPress={() => toggle(item.id)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <View style={styles.friendMain}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendMeta}>@{item.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 56,
          paddingBottom: 16 + insets.bottom + tabBarHeight,
        },
      ]}
    >
      <Stack.Screen options={{ title: 'Bjud in vänner' }} />

      <Text style={styles.sectionTitle}>Vänlista</Text>
      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        renderItem={renderFriend}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, submitting && styles.btnDisabled]}
        onPress={onSendSelected}
        disabled={submitting}
      >
        <Text style={styles.primaryBtnText}>Skicka inbjudan</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Sök och bjud in nya</Text>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Sök på användarnamn eller e‑post"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.secondaryBtn, submitting && styles.btnDisabled]}
          onPress={onInviteQuery}
          disabled={submitting}
        >
          <Text style={styles.secondaryBtnText}>Bjud in</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Pågående inbjudningar</Text>
      {pending.length === 0 ? (
        <Text style={styles.emptyPending}>Inga väntande inbjudningar.</Text>
      ) : (
        pending.map((inv) => (
          <View key={inv.id} style={styles.pendingRow}>
            <Text style={styles.pendingText}>
              {inv.target.type === 'friend'
                ? (() => {
                    const prof = idToProfile[inv.target.userId];
                    return prof ? `${prof.name} · @${prof.username}` : 'Vän';
                  })()
                : inv.target.type === 'email'
                ? inv.target.email
                : `@${inv.target.username}`}
            </Text>
            <View style={styles.pendingActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={() => declineInvite(inv.id)}>
                <Text style={styles.declineBtnText}>Avböj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptInvite(inv.id)}>
                <Text style={styles.acceptBtnText}>Acceptera</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
    padding: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 8,
  },
  listContent: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2f7147',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#2f7147',
  },
  friendMain: {
    flex: 1,
  },
  friendName: {
    fontWeight: '600',
    color: '#1f1f1f',
  },
  friendMeta: {
    color: '#2a2a2a',
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: '#2f7147',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  secondaryBtn: {
    backgroundColor: '#2f7147',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pendingText: {
    color: '#1f1f1f',
  },
  acceptBtn: {
    backgroundColor: '#2f7147',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyPending: {
    color: '#2a2a2a',
  },
});


