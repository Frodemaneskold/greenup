import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { createCompetition } from '@/lib/competitions-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';

export default function CreateCompetitionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Namn krävs', 'Ange ett namn för tävlingen.');
      return;
    }
    try {
      // Precheck: must be logged in (auth.uid present)
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        Alert.alert('Inte inloggad', 'Logga in för att skapa en tävling.');
        return;
      }
      const comp = await createCompetition({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      });
      Alert.alert('Tävling skapad', 'Inbjudningslänk har kopierats.');
      router.replace({
        pathname: '/(tabs)/leaderboard/competition/[id]',
        params: { id: comp.id, name: comp.name },
      });
    } catch (e: any) {
      Alert.alert(
        'Kunde inte skapa tävling',
        e?.message || 'Kontrollera att du är inloggad och försök igen.'
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 72, paddingBottom: 16 + insets.bottom }]}>
      <Stack.Screen options={{ title: 'Skapa tävling' }} />
      <View style={styles.card}>
        <Text style={styles.label}>Namn</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="T.ex. Kompisligan"
          style={styles.input}
        />

        <Text style={styles.label}>Beskrivning (valfritt)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Kort beskrivning"
          style={styles.input}
        />

        <Text style={styles.label}>Startdatum (valfritt)</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          style={styles.input}
        />

        <Text style={styles.label}>Slutdatum (valfritt)</Text>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          style={styles.input}
        />

        <TouchableOpacity onPress={onCreate} style={styles.button}>
          <Text style={styles.buttonText}>Skapa privat tävling</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tip}>Tävlingar är privata. Bjud in med länk eller användarnamn/e-post.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a7c7a3',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#1f1f1f',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  button: {
    backgroundColor: '#2f7147',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  tip: {
    marginTop: 12,
    fontSize: 12,
    color: '#1f1f1f',
  },
});


