import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchProjects } from '../utils/api';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const all = await fetchProjects();
      setProjects(all);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#111" />
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      data={projects}
      keyExtractor={p => String(p.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No projects yet.</Text>
          <Text style={styles.emptySubtext}>Create projects in the desktop app.</Text>
        </View>
      }
      renderItem={({ item: p }) => {
        const tasks = p.milestones?.flatMap(m => m.tasks) || [];
        const done = tasks.filter(t => t.completed).length;
        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        const overdue = tasks.filter(t => !t.completed && t.due_date && t.due_date < new Date().toISOString().slice(0, 10)).length;

        return (
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => navigation.navigate('Project', { projectId: p.id, projectName: p.name })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.projectName}>{p.name}</Text>
              {overdue > 0 && <Text style={styles.overdueTag}>{overdue} overdue</Text>}
            </View>
            {p.description ? <Text style={styles.projectDesc} numberOfLines={1}>{p.description}</Text> : null}
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressText}>{done}/{tasks.length}</Text>
            </View>
            <Text style={styles.meta}>{p.milestones?.length || 0} milestones · {pct}% complete</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#999' },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 14,
    marginHorizontal: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  projectName: { fontSize: 15, fontWeight: '600', flex: 1 },
  overdueTag: { fontSize: 11, color: '#c00', backgroundColor: '#fee8e8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  projectDesc: { fontSize: 12, color: '#888', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  progressBg: { flex: 1, height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#111', borderRadius: 2 },
  progressText: { fontSize: 11, color: '#888' },
  meta: { fontSize: 11, color: '#aaa' },
});
