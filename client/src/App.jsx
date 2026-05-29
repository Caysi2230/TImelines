import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { decodeProjectFromUrl } from './utils/share';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import ListView from './views/ListView';
import TimelineView from './views/TimelineView';
import Settings from './views/Settings';
import SharedView from './views/SharedView';
import './App.css';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const sharedData = decodeProjectFromUrl();
  if (sharedData) return <SharedView project={sharedData} />;

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProjectId) loadProject(activeProjectId);
    else setProject(null);
  }, [activeProjectId]);

  async function loadProjects() {
    try {
      const list = await api.projects.list();
      setProjects(list);
      if (list.length > 0 && !activeProjectId) {
        setActiveProjectId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadProject(id) {
    try {
      const p = await api.projects.get(id);
      setProject(p);
    } catch (e) {
      console.error(e);
    }
  }

  function refresh() {
    if (activeProjectId) loadProject(activeProjectId);
    loadProjects();
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--gray-500)' }}>
      Loading…
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => { setActiveProjectId(id); setView('list'); }}
        onProjectsChange={loadProjects}
        view={view}
        onViewChange={setView}
      />
      <main className="app-main">
        {view === 'settings' ? (
          <Settings />
        ) : view === 'dashboard' ? (
          <Dashboard projects={projects} onSelectProject={(id) => { setActiveProjectId(id); setView('list'); }} />
        ) : project ? (
          view === 'timeline' ? (
            <TimelineView project={project} onRefresh={refresh} />
          ) : (
            <ListView project={project} onRefresh={refresh} />
          )
        ) : (
          <div className="empty-state">
            <h2>No project selected</h2>
            <p>Create a project or select one from the sidebar.</p>
          </div>
        )}
      </main>
    </div>
  );
}
