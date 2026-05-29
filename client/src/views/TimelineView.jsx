import React, { useMemo, useRef, useState } from 'react';
import { isOverdue, isDueToday } from '../utils/dates';
import TaskModal from '../components/TaskModal';
import { api } from '../utils/api';
import './TimelineView.css';

const DAY_WIDTH = 32;

export default function TimelineView({ project, onRefresh }) {
  const [editTask, setEditTask] = useState(null);
  const scrollRef = useRef(null);

  const allDates = useMemo(() => {
    const dates = [];
    project.milestones.forEach(m => {
      if (m.target_date) dates.push(m.target_date);
      m.tasks.forEach(t => { if (t.due_date) dates.push(t.due_date); });
    });
    return dates;
  }, [project]);

  const startDate = useMemo(() => {
    if (allDates.length === 0) return new Date();
    const min = allDates.reduce((a, b) => a < b ? a : b);
    const d = new Date(min + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    return d;
  }, [allDates]);

  const endDate = useMemo(() => {
    if (allDates.length === 0) {
      const d = new Date();
      d.setDate(d.getDate() + 60);
      return d;
    }
    const max = allDates.reduce((a, b) => a > b ? a : b);
    const d = new Date(max + 'T00:00:00');
    d.setDate(d.getDate() + 14);
    return d;
  }, [allDates]);

  const totalDays = Math.ceil((endDate - startDate) / 86400000);
  const totalWidth = totalDays * DAY_WIDTH;

  function dayOffset(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return Math.floor((d - startDate) / 86400000) * DAY_WIDTH;
  }

  const todayOffset = dayOffset(new Date().toISOString().slice(0, 10));

  const months = useMemo(() => {
    const result = [];
    let current = new Date(startDate);
    while (current < endDate) {
      const offset = Math.floor((current - startDate) / 86400000) * DAY_WIDTH;
      result.push({ label: current.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }), offset });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return result;
  }, [startDate, endDate]);

  const weeks = useMemo(() => {
    const result = [];
    let current = new Date(startDate);
    // Advance to Monday
    while (current.getDay() !== 1) current.setDate(current.getDate() + 1);
    while (current < endDate) {
      result.push(Math.floor((current - startDate) / 86400000) * DAY_WIDTH);
      current.setDate(current.getDate() + 7);
    }
    return result;
  }, [startDate, endDate]);

  async function toggleTask(task) {
    await api.tasks.update(task.id, { ...task, completed: !task.completed });
    onRefresh();
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="view-header">
        <h1>{project.name} — Timeline</h1>
      </div>

      <div className="timeline-container" ref={scrollRef}>
        {/* Fixed left labels */}
        <div className="timeline-labels">
          <div className="timeline-header-spacer" />
          {project.milestones.map(m => (
            <div key={m.id} className="timeline-label-group">
              <div className="timeline-label milestone-label">
                <span className="tag" style={{ background: m.color, width: 8, height: 8 }} />
                {m.name}
              </div>
              {m.tasks.map(t => (
                <div key={t.id} className={`timeline-label task-label ${t.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTask(t)}
                    style={{ width: 'auto', flexShrink: 0 }}
                  />
                  <span
                    onClick={() => setEditTask({ task: t, milestoneId: m.id })}
                    style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Scrollable chart area */}
        <div className="timeline-scroll">
          <div style={{ width: totalWidth, minWidth: '100%', position: 'relative' }}>
            {/* Month headers */}
            <div className="timeline-months" style={{ width: totalWidth }}>
              {months.map((m, i) => (
                <div key={i} className="timeline-month" style={{ left: m.offset }}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* Week grid lines */}
            <div className="timeline-grid" style={{ width: totalWidth }}>
              {weeks.map((x, i) => (
                <div key={i} className="grid-week" style={{ left: x }} />
              ))}
              {todayOffset != null && (
                <div className="grid-today" style={{ left: todayOffset }} />
              )}
            </div>

            {/* Bars */}
            {project.milestones.map(m => {
              const mOffset = dayOffset(m.target_date);
              return (
                <div key={m.id} className="timeline-row-group">
                  {/* Milestone row */}
                  <div className="timeline-row milestone-row">
                    {mOffset != null && (
                      <div
                        className="milestone-marker"
                        style={{ left: mOffset, background: m.color }}
                        title={`${m.name}: ${m.target_date}`}
                      />
                    )}
                  </div>

                  {/* Task rows */}
                  {m.tasks.map(t => {
                    const tOffset = dayOffset(t.due_date);
                    return (
                      <div key={t.id} className="timeline-row task-row-tl">
                        {tOffset != null && (
                          <div
                            className={`task-bar priority-${t.priority} ${t.completed ? 'bar-done' : ''} ${isOverdue(t.due_date) && !t.completed ? 'bar-overdue' : ''}`}
                            style={{ left: Math.max(0, tOffset - 40), width: 80 }}
                            title={`${t.name}: ${t.due_date}`}
                            onClick={() => setEditTask({ task: t, milestoneId: m.id })}
                          >
                            {t.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
