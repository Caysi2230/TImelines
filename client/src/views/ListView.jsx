import React, { useState, useRef } from 'react';
import { api } from '../utils/api';
import { isOverdue, isDueToday, formatDate } from '../utils/dates';
import { encodeProjectToUrl, copyToClipboard } from '../utils/share';
import MilestoneModal from '../components/MilestoneModal';
import TaskModal from '../components/TaskModal';
import ImprovementPanel from '../components/ImprovementPanel';
import './ListView.css';

export default function ListView({ project, onRefresh }) {
  const [editMilestone, setEditMilestone] = useState(null);
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [newTaskMilestoneId, setNewTaskMilestoneId] = useState(null);
  const [showImprove, setShowImprove] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editProject, setEditProject] = useState(false);
  const [projName, setProjName] = useState(project.name);
  const [projDesc, setProjDesc] = useState(project.description);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  async function toggleTask(task) {
    await api.tasks.update(task.id, { ...task, completed: !task.completed });
    onRefresh();
  }

  async function toggleCollapse(m) {
    await api.milestones.update(m.id, { ...m, collapsed: !m.collapsed });
    onRefresh();
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    await api.tasks.delete(id);
    onRefresh();
  }

  async function deleteMilestone(id) {
    if (!confirm('Delete this milestone and all its tasks?')) return;
    await api.milestones.delete(id);
    onRefresh();
  }

  async function shareUrl() {
    const url = encodeProjectToUrl(project);
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveProjectName() {
    await api.projects.update(project.id, { name: projName, description: projDesc });
    setEditProject(false);
    onRefresh();
  }

  // Drag reorder milestones
  function onDragStartMilestone(e, idx) {
    dragItem.current = { type: 'milestone', idx };
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOverMilestone(e, idx) {
    e.preventDefault();
    dragOver.current = idx;
  }

  async function onDropMilestone() {
    if (dragItem.current?.type !== 'milestone') return;
    const milestones = [...project.milestones];
    const from = dragItem.current.idx;
    const to = dragOver.current;
    if (from === to || to == null) return;
    const [moved] = milestones.splice(from, 1);
    milestones.splice(to, 0, moved);
    await api.milestones.reorder(milestones.map(m => m.id));
    onRefresh();
    dragItem.current = null;
    dragOver.current = null;
  }

  // Drag reorder tasks within a milestone
  function onDragStartTask(e, milestoneId, taskIdx) {
    dragItem.current = { type: 'task', milestoneId, taskIdx };
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOverTask(e, taskIdx) {
    e.preventDefault();
    dragOver.current = taskIdx;
  }

  async function onDropTask(milestoneId) {
    if (dragItem.current?.type !== 'task') return;
    const m = project.milestones.find(m => m.id === milestoneId);
    if (!m) return;
    const tasks = [...m.tasks];
    const from = dragItem.current.taskIdx;
    const to = dragOver.current;
    if (from === to || to == null) return;
    const [moved] = tasks.splice(from, 1);
    tasks.splice(to, 0, moved);
    await api.tasks.reorder(tasks.map(t => t.id));
    onRefresh();
    dragItem.current = null;
    dragOver.current = null;
  }

  const totalTasks = project.milestones.reduce((a, m) => a + m.tasks.length, 0);
  const completedTasks = project.milestones.reduce((a, m) => a + m.tasks.filter(t => t.completed).length, 0);
  const overallPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="view-header">
          <div style={{ flex: 1 }}>
            {editProject ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={projName} onChange={e => setProjName(e.target.value)} style={{ fontWeight: 600, fontSize: 16 }} />
                <button className="btn-primary" onClick={saveProjectName}>Save</button>
                <button className="btn-ghost" onClick={() => setEditProject(false)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1>{project.name}</h1>
                <button className="btn-icon" onClick={() => setEditProject(true)}>✎</button>
              </div>
            )}
            {project.description && !editProject && (
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{project.description}</p>
            )}
          </div>
          <div className="view-header-actions">
            <button className="btn-secondary" onClick={() => setShowImprove(!showImprove)}>✦ Improve</button>
            <button className="btn-secondary" onClick={shareUrl}>{copied ? '✓ Copied!' : '⎘ Share'}</button>
            <a href={`/api/export/${project.id}/html`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center' }} download>↓ HTML</a>
            <button className="btn-secondary" onClick={() => window.print()}>↓ PDF</button>
            <button className="btn-primary" onClick={() => setShowNewMilestone(true)}>+ Milestone</button>
          </div>
        </div>

        <div className="view-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
              {completedTasks}/{totalTasks} tasks · {overallPct}%
            </span>
          </div>

          {project.milestones.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)' }}>
              <p>No milestones yet.</p>
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowNewMilestone(true)}>
                Add First Milestone
              </button>
            </div>
          )}

          {project.milestones.map((m, mi) => {
            const mTotal = m.tasks.length;
            const mDone = m.tasks.filter(t => t.completed).length;
            const mPct = mTotal ? Math.round((mDone / mTotal) * 100) : 0;

            return (
              <div
                key={m.id}
                className="milestone-block"
                draggable
                onDragStart={e => onDragStartMilestone(e, mi)}
                onDragOver={e => onDragOverMilestone(e, mi)}
                onDrop={onDropMilestone}
              >
                <div className="milestone-header" style={{ borderLeftColor: m.color }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <span className="drag-handle" title="Drag to reorder">⠿</span>
                    <span
                      className="collapse-btn"
                      onClick={() => toggleCollapse(m)}
                      title={m.collapsed ? 'Expand' : 'Collapse'}
                    >
                      {m.collapsed ? '▶' : '▼'}
                    </span>
                    <div className="tag" style={{ background: m.color }} />
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    {m.target_date && (
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{formatDate(m.target_date)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{mDone}/{mTotal}</span>
                    <div className="progress-bar" style={{ width: 60 }}>
                      <div className="progress-fill" style={{ width: `${mPct}%` }} />
                    </div>
                    <button className="btn-icon" onClick={() => setEditMilestone(m)} title="Edit">✎</button>
                    <button className="btn-icon" onClick={() => deleteMilestone(m.id)} title="Delete" style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                </div>

                {!m.collapsed && (
                  <div className="milestone-tasks">
                    {m.tasks.map((task, ti) => (
                      <div
                        key={task.id}
                        className={`task-item ${task.completed ? 'completed' : ''}`}
                        draggable
                        onDragStart={e => onDragStartTask(e, m.id, ti)}
                        onDragOver={e => onDragOverTask(e, ti)}
                        onDrop={() => onDropTask(m.id)}
                      >
                        <span className="drag-handle">⠿</span>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task)}
                          style={{ width: 'auto', flexShrink: 0 }}
                        />
                        <span
                          className="task-name"
                          onClick={() => setEditTask({ task, milestoneId: m.id })}
                        >
                          {task.name}
                        </span>
                        {task.due_date && (
                          <span className={`task-date ${isOverdue(task.due_date) && !task.completed ? 'overdue' : isDueToday(task.due_date) ? 'today' : ''}`}>
                            {formatDate(task.due_date)}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="task-assignee">{task.assignee}</span>
                        )}
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        <button className="btn-icon" onClick={() => deleteTask(task.id)} style={{ color: 'var(--gray-400)' }}>✕</button>
                      </div>
                    ))}
                    <button
                      className="add-task-btn"
                      onClick={() => setNewTaskMilestoneId(m.id)}
                    >
                      + Add task
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showImprove && (
        <ImprovementPanel projectId={project.id} onClose={() => setShowImprove(false)} />
      )}

      {showNewMilestone && (
        <MilestoneModal
          projectId={project.id}
          onClose={() => setShowNewMilestone(false)}
          onSave={async (data) => {
            await api.milestones.create({ ...data, position: project.milestones.length });
            setShowNewMilestone(false);
            onRefresh();
          }}
        />
      )}

      {editMilestone && (
        <MilestoneModal
          milestone={editMilestone}
          projectId={project.id}
          onClose={() => setEditMilestone(null)}
          onSave={async (data) => {
            await api.milestones.update(editMilestone.id, { ...editMilestone, ...data });
            setEditMilestone(null);
            onRefresh();
          }}
        />
      )}

      {newTaskMilestoneId && (
        <TaskModal
          milestoneId={newTaskMilestoneId}
          projectId={project.id}
          milestones={project.milestones}
          onClose={() => setNewTaskMilestoneId(null)}
          onSave={async (data) => {
            const m = project.milestones.find(m => m.id === data.milestone_id);
            await api.tasks.create({ ...data, position: m ? m.tasks.length : 0 });
            setNewTaskMilestoneId(null);
            onRefresh();
          }}
        />
      )}

      {editTask && (
        <TaskModal
          task={editTask.task}
          milestoneId={editTask.milestoneId}
          projectId={project.id}
          milestones={project.milestones}
          onClose={() => setEditTask(null)}
          onSave={async (data) => {
            await api.tasks.update(editTask.task.id, { ...editTask.task, ...data });
            setEditTask(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
