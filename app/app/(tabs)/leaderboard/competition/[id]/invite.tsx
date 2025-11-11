import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getFriends, isValidEmail, isValidUsername, sendInvites } from '@/lib/users-store';
import { addPendingInvites, getPendingInvitesForCompetition, subscribeInvites, acceptInvite, declineInvite } from '@/lib/invites-store';

type SelectableFriend = {
  id: string;
  name: string;
  username: string;
  email: string;
};

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friends = useMemo(() => getFriends(), []);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(() => (typeof id === 'string' ? getPendingInvitesForCompetition(id) : []));

  React.useEffect(() => {
    const unsub = subscribeInvites(() => {
      if (typeof id === 'string') {
        setPending(getPendingInvitesForCompetition(id));
      }
    });
    return unsub;
  }, [id]);

  const toggle = (userId: string) => {
    setSelected((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const onSendSelected = async () => {
    const targets = Object.keys(selected)
      .filter((k) => selected[k])
      .map((userId) => ({ type: 'friend' as const, userId }));
    if (targets.length === 0 || typeof id !== 'string') {
      Alert.alert('Välj minst en vän');
      return;
    }
    setSubmitting(true);
    try {
      await sendInvites(id, targets);
      addPendingInvites(id, targets);
      Alert.alert('Inbjudningar skickade');
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
    let target:
      | { type: 'email'; email: string }
      | { type: 'username'; username: string }
      | null = null;
    if (isValidEmail(trimmed)) {
      target = { type: 'email', email: trimmed };
    } else if (isValidUsername(trimmed)) {
      target = { type: 'username', username: trimmed };
    }
    if (!target) {
      Alert.alert('Ogiltig input', 'Kontrollera stavning eller använd en giltig e‑post.');
      return;
    }
    setSubmitting(true);
    try {
      await sendInvites(id, [target]);
      Alert.alert('Inbjudan skickad');
      setQuery('');
      addPendingInvites(id, [target]);
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
          <Text style={styles.friendMeta}>@{item.username} · {item.email}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
                ? `Vän ${inv.target.userId}`
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


