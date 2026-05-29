import React, { useState } from 'react';

export default function TaskModal({ task, milestoneId, projectId, milestones, onClose, onSave }) {
  const [name, setName] = useState(task?.name || '');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [assignee, setAssignee] = useState(task?.assignee || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [selectedMilestone, setSelectedMilestone] = useState(task?.milestone_id || milestoneId);

  async function handleSave() {
    if (!name.trim()) return;
    await onSave({
      name,
      due_date: dueDate || null,
      assignee,
      priority,
      milestone_id: selectedMilestone,
      project_id: projectId
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>Task Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Task name" autoFocus />
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>Assignee</label>
            <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name or email" />
          </div>
          {milestones && (
            <div className="form-row">
              <label>Milestone</label>
              <select value={selectedMilestone} onChange={e => setSelectedMilestone(parseInt(e.target.value))}>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim()}>
            {task ? 'Save' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
