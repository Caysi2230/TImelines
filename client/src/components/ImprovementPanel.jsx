import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './ImprovementPanel.css';

export default function ImprovementPanel({ projectId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.ai.improve(projectId);
      setSuggestions(result.suggestions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function dismiss(id) {
    setDismissed(prev => new Set([...prev, id]));
  }

  const visible = suggestions.filter(s => !dismissed.has(s.id));

  return (
    <div className="improvement-panel">
      <div className="improvement-header">
        <div>
          <h3>AI Suggestions</h3>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
            {loading ? 'Analysing timeline…' : `${visible.length} suggestions`}
          </p>
        </div>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="improvement-body">
        {loading && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)' }}>
            Analysing your timeline…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
            {dismissed.size > 0 ? 'All suggestions dismissed.' : 'No issues found — timeline looks good!'}
          </div>
        )}
        {visible.map(s => (
          <div key={s.id} className={`suggestion suggestion-${s.severity}`}>
            <div className="suggestion-header">
              <span className="suggestion-type">{s.type.replace(/_/g, ' ')}</span>
              <button className="btn-icon" onClick={() => dismiss(s.id)} title="Dismiss">✕</button>
            </div>
            <p className="suggestion-title">{s.title}</p>
            <p className="suggestion-desc">{s.description}</p>
            {s.action && <p className="suggestion-action">→ {s.action}</p>}
          </div>
        ))}
      </div>

      {!loading && (
        <div className="improvement-footer">
          <button className="btn-secondary" onClick={load} style={{ fontSize: 12 }}>↺ Refresh</button>
          {dismissed.size > 0 && (
            <button className="btn-ghost" onClick={() => setDismissed(new Set())} style={{ fontSize: 12 }}>
              Show {dismissed.size} dismissed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
