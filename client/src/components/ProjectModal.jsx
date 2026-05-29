import React, { useState } from 'react';
import { api } from '../utils/api';

export default function ProjectModal({ project, onClose, onSave }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [aiDescription, setAiDescription] = useState('');
  const [showAi, setShowAi] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  async function handleGenerate() {
    if (!aiDescription.trim()) return;
    setGenerating(true);
    setAiError('');
    try {
      const result = await api.ai.generate(aiDescription);
      setAiResult(result);
      setName(result.project_name);
      setDescription(result.project_description);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    await onSave({ name, description, aiResult });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!project && (
            <div className="form-row">
              <button
                className={`btn-secondary`}
                onClick={() => setShowAi(!showAi)}
                style={{ marginBottom: 12, width: '100%', justifyContent: 'center', display: 'flex', gap: 8, alignItems: 'center' }}
              >
                ✦ {showAi ? 'Hide AI Generator' : 'Generate with AI'}
              </button>
            </div>
          )}

          {showAi && (
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16 }}>
              <div className="form-row">
                <label>Describe your project</label>
                <textarea
                  rows={3}
                  placeholder="e.g. brand activation event on 15th August, need to cover production, logistics, client approvals and bump-in"
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                />
              </div>
              {aiError && <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{aiError}</p>}
              <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating…' : 'Generate Timeline'}
              </button>
              {aiResult && (
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
                  ✓ Generated {aiResult.milestones?.length} milestones with {aiResult.milestones?.reduce((a, m) => a + m.tasks.length, 0)} tasks
                </p>
              )}
            </div>
          )}

          <div className="form-row">
            <label>Project Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Project" autoFocus />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim()}>
            {project ? 'Save' : (aiResult ? 'Create with AI Timeline' : 'Create Project')}
          </button>
        </div>
      </div>
    </div>
  );
}
