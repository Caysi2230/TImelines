import React, { useState } from 'react';
import { api } from '../utils/api';
import ProjectModal from './ProjectModal';
import './Sidebar.css';

export default function Sidebar({ projects, activeProjectId, onSelectProject, onProjectsChange, view, onViewChange }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">Timelines</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <span className="nav-icon">⬛</span> Dashboard
        </button>
      </nav>

      <div className="sidebar-section-title">
        Projects
        <button className="btn-icon" onClick={() => setShowCreate(true)} title="New project">＋</button>
      </div>

      <div className="sidebar-projects">
        {projects.map(p => (
          <div
            key={p.id}
            className={`sidebar-project ${activeProjectId === p.id ? 'active' : ''}`}
            onClick={() => onSelectProject(p.id)}
          >
            <span className="project-dot" />
            <span className="project-name">{p.name}</span>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="sidebar-empty">No projects yet</div>
        )}
      </div>

      {activeProjectId && (
        <>
          <div className="sidebar-section-title">Views</div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${view === 'list' ? 'active' : ''}`}
              onClick={() => onViewChange('list')}
            >
              <span className="nav-icon">☰</span> List
            </button>
            <button
              className={`sidebar-nav-item ${view === 'timeline' ? 'active' : ''}`}
              onClick={() => onViewChange('timeline')}
            >
              <span className="nav-icon">▤</span> Timeline
            </button>
          </nav>
        </>
      )}

      <div className="sidebar-bottom">
        <button
          className={`sidebar-nav-item ${view === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <span className="nav-icon">⚙</span> Settings
        </button>
      </div>

      {showCreate && (
        <ProjectModal
          onClose={() => setShowCreate(false)}
          onSave={async ({ name, description, aiResult }) => {
            const proj = await api.projects.create({ name, description });
            if (aiResult?.milestones) {
              for (let mi = 0; mi < aiResult.milestones.length; mi++) {
                const m = aiResult.milestones[mi];
                const milestone = await api.milestones.create({
                  project_id: proj.id,
                  name: m.name,
                  target_date: m.target_date || null,
                  color: m.color || '#111111',
                  position: mi
                });
                for (let ti = 0; ti < (m.tasks || []).length; ti++) {
                  const t = m.tasks[ti];
                  await api.tasks.create({
                    milestone_id: milestone.id,
                    project_id: proj.id,
                    name: t.name,
                    due_date: t.due_date || null,
                    assignee: t.assignee || '',
                    priority: t.priority || 'medium',
                    position: ti
                  });
                }
              }
            }
            onProjectsChange();
            onSelectProject(proj.id);
            setShowCreate(false);
          }}
        />
      )}
    </aside>
  );
}
