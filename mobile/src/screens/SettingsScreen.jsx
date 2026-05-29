import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert
} from 'react-native';
import { getHost, setHost } from '../utils/api';
import { scheduleAllNotifications, requestPermissions } from '../utils/notifications';

export default function SettingsScreen() {
  const [host, setHostState] = useState('http://localhost:3000');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getHost().then(setHostState);
  }, []);

  async function save() {
    await setHost(host);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function enableNotifications() {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission denied', 'Enable notifications in your device Settings to receive briefings.');
      return;
    }
    await scheduleAllNotifications();
    Alert.alert('Notifications enabled', 'You\'ll receive a morning briefing, day-before reminders, and overdue alerts.');
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desktop App Connection</Text>
        <Text style={styles.desc}>
          Enter the IP address of the computer running the desktop app. Both devices must be on the same Wi-Fi network.
        </Text>
        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHostState}
          placeholder="http://192.168.1.x:3000"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.hint}>
          Find your desktop IP: on Mac run `ipconfig getifaddr en0`, on Windows run `ipconfig` and look for IPv4.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>{saved ? '✓ Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <Text style={styles.desc}>
          Morning briefing at 7am, day-before reminders, and overdue alerts. Tap a notification to open the relevant project.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={enableNotifications}>
          <Text style={styles.btnText}>Enable Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.desc}>Timelines mobile app — syncs with your local desktop app over Wi-Fi.</Text>
        <Text style={styles.desc}>Data is cached locally for offline reading. Changes sync when back online.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { backgroundColor: '#fff', margin: 14, marginBottom: 0, borderRadius: 6, padding: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  desc: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '500', color: '#666', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 4,
    padding: 10, fontSize: 14, backgroundColor: '#fff', marginBottom: 6
  },
  hint: { fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 16 },
  btn: { backgroundColor: '#111', borderRadius: 4, padding: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '500', fontSize: 14 },
});
