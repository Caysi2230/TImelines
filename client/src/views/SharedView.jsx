import React, { useState } from 'react';
import { formatDate, isOverdue } from '../utils/dates';

export default function SharedView({ project }) {
  const [collapsed, setCollapsed] = useState({});

  const totalTasks = project.milestones?.reduce((a, m) => a + (m.tasks?.length || 0), 0) || 0;
  const doneTasks = project.milestones?.reduce((a, m) => a + (m.tasks?.filter(t => t.completed).length || 0), 0) || 0;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui,sans-serif', color: '#111' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Shared Project</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{project.name}</h1>
        {project.description && <p style={{ color: '#666', fontSize: 14 }}>{project.description}</p>}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: '#eee', borderRadius: 3 }}>
            <div style={{ height: 6, background: '#111', width: `${pct}%`, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, color: '#666' }}>{doneTasks}/{totalTasks} tasks · {pct}%</span>
        </div>
      </div>

      {(project.milestones || []).map(m => {
        const mDone = m.tasks?.filter(t => t.completed).length || 0;
        const mPct = m.tasks?.length ? Math.round((mDone / m.tasks.length) * 100) : 0;
        const isCollapsed = collapsed[m.id];

        return (
          <div key={m.id} style={{ marginBottom: 16, border: '1px solid #e5e5e5', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{ background: '#f5f5f5', padding: '10px 14px', borderLeft: `4px solid ${m.color || '#111'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setCollapsed(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10 }}>{isCollapsed ? '▶' : '▼'}</span>
                <strong style={{ fontSize: 13 }}>{m.name}</strong>
                {m.target_date && <span style={{ fontSize: 11, color: '#888' }}>{formatDate(m.target_date)}</span>}
              </div>
              <span style={{ fontSize: 11, color: '#888' }}>{mDone}/{m.tasks?.length} · {mPct}%</span>
            </div>

            {!isCollapsed && (
              <div>
                {(m.tasks || []).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid #f5f5f5', opacity: t.completed ? 0.5 : 1 }}>
                    <span style={{ fontSize: 14 }}>{t.completed ? '✓' : '○'}</span>
                    <span style={{ flex: 1, fontSize: 13, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.name}</span>
                    {t.due_date && (
                      <span style={{ fontSize: 11, color: isOverdue(t.due_date) && !t.completed ? '#c00' : '#888' }}>
                        {formatDate(t.due_date)}
                      </span>
                    )}
                    {t.assignee && <span style={{ fontSize: 11, background: '#eee', padding: '1px 6px', borderRadius: 999 }}>{t.assignee}</span>}
                    <span style={{ fontSize: 10, background: t.priority === 'high' ? '#fee' : t.priority === 'medium' ? '#fffbcc' : '#f5f5f5', color: t.priority === 'high' ? '#c00' : '#666', padding: '1px 6px', borderRadius: 999 }}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee', fontSize: 11, color: '#bbb', textAlign: 'center' }}>
        Shared via Timelines
      </div>
    </div>
  );
}
