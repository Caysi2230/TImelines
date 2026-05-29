import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchProject, toggleTask } from '../utils/api';

const PRIORITY_COLOR = { high: '#c00', medium: '#886600', low: '#888' };

export default function ProjectScreen({ route }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [projectId]));

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    const p = await fetchProject(projectId);
    setProject(p);
    setRefreshing(false);
  }

  async function handleToggle(task) {
    try {
      await toggleTask(task);
      load();
    } catch {}
  }

  if (!project) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#111" />
    </View>
  );

  const today = new Date().toISOString().slice(0, 10);
  const allTasks = project.milestones.flatMap(m => m.tasks);
  const done = allTasks.filter(t => t.completed).length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.header}>
        {project.description ? <Text style={styles.desc}>{project.description}</Text> : null}
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>{done}/{allTasks.length} · {pct}%</Text>
        </View>
      </View>

      {project.milestones.map(m => {
        const mDone = m.tasks.filter(t => t.completed).length;
        const mPct = m.tasks.length ? Math.round((mDone / m.tasks.length) * 100) : 0;
        const isCollapsed = collapsed[m.id];

        return (
          <View key={m.id} style={styles.milestoneBlock}>
            <TouchableOpacity
              style={[styles.milestoneHeader, { borderLeftColor: m.color || '#111' }]}
              onPress={() => setCollapsed(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
            >
              <View style={styles.milestoneLeft}>
                <View style={[styles.colorDot, { backgroundColor: m.color || '#111' }]} />
                <Text style={styles.milestoneName}>{m.name}</Text>
              </View>
              <View style={styles.milestoneRight}>
                <Text style={styles.milestoneMeta}>{mDone}/{m.tasks.length}</Text>
                <Text style={styles.collapseIcon}>{isCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {m.target_date && (
              <View style={[styles.milestoneHeader, { paddingTop: 0, paddingBottom: 6, backgroundColor: '#f9f9f9' }]}>
                <Text style={styles.targetDate}>Target: {m.target_date}</Text>
                <View style={[styles.progressBg, { flex: 1, marginLeft: 10 }]}>
                  <View style={[styles.progressFill, { width: `${mPct}%` }]} />
                </View>
              </View>
            )}

            {!isCollapsed && m.tasks.map(task => {
              const overdue = !task.completed && task.due_date && task.due_date < today;
              const dueToday = !task.completed && task.due_date === today;

              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskRow, task.completed && styles.taskDone]}
                  onPress={() => handleToggle(task)}
                >
                  <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
                    {task.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskName, task.completed && styles.taskNameDone]}>{task.name}</Text>
                    <View style={styles.taskMeta}>
                      {task.due_date && (
                        <Text style={[styles.taskDate, overdue && styles.taskDateOverdue, dueToday && styles.taskDateToday]}>
                          {overdue ? `Overdue ${task.due_date}` : dueToday ? 'Due today' : task.due_date}
                        </Text>
                      )}
                      {task.assignee ? <Text style={styles.assignee}>{task.assignee}</Text> : null}
                      <Text style={[styles.priorityTag, { color: PRIORITY_COLOR[task.priority] }]}>
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  desc: { fontSize: 13, color: '#666', marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg: { flex: 1, height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#111', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#888' },
  milestoneBlock: { backgroundColor: '#fff', marginTop: 10, marginHorizontal: 14, borderRadius: 6, borderWidth: 1, borderColor: '#e5e5e5', overflow: 'hidden' },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderLeftWidth: 4, borderLeftColor: '#111', backgroundColor: '#f5f5f5' },
  milestoneLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  milestoneName: { fontSize: 14, fontWeight: '600', flex: 1 },
  milestoneRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneMeta: { fontSize: 12, color: '#888' },
  collapseIcon: { fontSize: 10, color: '#888' },
  targetDate: { fontSize: 11, color: '#888' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  taskDone: { opacity: 0.55 },
  checkbox: { width: 18, height: 18, borderRadius: 3, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxDone: { backgroundColor: '#111', borderColor: '#111' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  taskContent: { flex: 1 },
  taskName: { fontSize: 13, color: '#111', marginBottom: 4 },
  taskNameDone: { textDecorationLine: 'line-through', color: '#999' },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  taskDate: { fontSize: 11, color: '#888' },
  taskDateOverdue: { color: '#c00', fontWeight: '500' },
  taskDateToday: { color: '#996600', fontWeight: '500' },
  assignee: { fontSize: 11, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  priorityTag: { fontSize: 11 },
});
