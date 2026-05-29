import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { today, isOverdue, isDueToday, daysUntil, formatDate } from '../utils/dates';
import './Dashboard.css';

export default function Dashboard({ projects, onSelectProject }) {
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [projects]);

  async function loadAll() {
    if (projects.length === 0) { setLoading(false); return; }
    try {
      const all = await Promise.all(projects.map(p => api.projects.get(p.id)));
      setProjectData(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const allTasks = projectData.flatMap(p =>
    p.milestones.flatMap(m => m.tasks.map(t => ({
      ...t,
      projectName: p.name,
      projectId: p.id,
      milestoneName: m.name
    })))
  );

  const dueToday = allTasks.filter(t => !t.completed && isDueToday(t.due_date));
  const overdue = allTasks.filter(t => !t.completed && isOverdue(t.due_date));
  const upcoming = allTasks.filter(t => !t.completed && t.due_date && daysUntil(t.due_date) > 0 && daysUntil(t.due_date) <= 7);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.completed).length;
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) return <div style={{ padding: 40, color: 'var(--gray-400)' }}>Loading…</div>;

  return (
    <div>
      <div className="view-header">
        <h1>Dashboard</h1>
      </div>
      <div className="view-content">
        {projects.length === 0 ? (
          <div className="empty-state" style={{ height: 300 }}>
            <h2>No projects yet</h2>
            <p>Create a project using the + button in the sidebar.</p>
          </div>
        ) : (
          <>
            <div className="dash-stats">
              <div className="stat-card">
                <div className="stat-value">{projects.length}</div>
                <div className="stat-label">Projects</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: overdue.length > 0 ? 'var(--danger)' : 'inherit' }}>
                  {overdue.length}
                </div>
                <div className="stat-label">Overdue</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overallProgress}%</div>
                <div className="stat-label">Overall Progress</div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="dash-grid">
              <div>
                <h2 className="dash-section-title">Projects</h2>
                {projectData.map(p => {
                  const tasks = p.milestones.flatMap(m => m.tasks);
                  const done = tasks.filter(t => t.completed).length;
                  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
                  return (
                    <div key={p.id} className="project-card" onClick={() => onSelectProject(p.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          {p.description && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{p.description}</div>}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                          {done}/{tasks.length} tasks
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                        {p.milestones.length} milestones · {pct}% complete
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                {dueToday.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h2 className="dash-section-title">Due Today ({dueToday.length})</h2>
                    {dueToday.map(t => (
                      <TaskRow key={t.id} task={t} onClick={() => onSelectProject(t.projectId)} />
                    ))}
                  </div>
                )}

                {overdue.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h2 className="dash-section-title" style={{ color: 'var(--danger)' }}>Overdue ({overdue.length})</h2>
                    {overdue.map(t => (
                      <TaskRow key={t.id} task={t} overdue onClick={() => onSelectProject(t.projectId)} />
                    ))}
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <h2 className="dash-section-title">Due This Week ({upcoming.length})</h2>
                    {upcoming.map(t => (
                      <TaskRow key={t.id} task={t} onClick={() => onSelectProject(t.projectId)} />
                    ))}
                  </div>
                )}

                {dueToday.length === 0 && overdue.length === 0 && upcoming.length === 0 && (
                  <div style={{ color: 'var(--gray-400)', fontSize: 13, paddingTop: 40 }}>
                    Nothing due today or this week.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, overdue, onClick }) {
  const days = daysUntil(task.due_date);
  return (
    <div className="task-row" onClick={onClick} style={{ borderLeftColor: overdue ? 'var(--danger)' : 'var(--gray-300)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
          {task.projectName} / {task.milestoneName}
          {task.assignee && ` · ${task.assignee}`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--gray-600)' }}>
          {overdue ? `${Math.abs(days)}d ago` : `${formatDate(task.due_date)}`}
        </div>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      </div>
    </div>
  );
}
