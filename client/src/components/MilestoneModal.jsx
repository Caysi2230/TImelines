import React, { useState } from 'react';

const COLORS = [
  '#111111', '#333333', '#555555', '#777777', '#999999',
  '#1a3a5c', '#2d6a4f', '#7b2d00', '#4a0072', '#2b5876'
];

export default function MilestoneModal({ milestone, projectId, onClose, onSave }) {
  const [name, setName] = useState(milestone?.name || '');
  const [targetDate, setTargetDate] = useState(milestone?.target_date || '');
  const [color, setColor] = useState(milestone?.color || '#111111');

  async function handleSave() {
    if (!name.trim()) return;
    await onSave({ name, target_date: targetDate, color, project_id: projectId });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{milestone ? 'Edit Milestone' : 'New Milestone'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Milestone name" autoFocus />
          </div>
          <div className="form-row">
            <label>Target Date</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Colour</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? '2px solid #000' : 'none',
                    outlineOffset: 2
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: 28, height: 28, padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }}
                title="Custom color"
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim()}>
            {milestone ? 'Save' : 'Add Milestone'}
          </button>
        </div>
      </div>
    </div>
  );
}
