const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { milestone_id, project_id, name, due_date = null, assignee = '', priority = 'medium', position = 0 } = req.body;
  if (!milestone_id || !project_id || !name) return res.status(400).json({ error: 'milestone_id, project_id, name required' });
  const result = db.prepare(
    'INSERT INTO tasks (milestone_id, project_id, name, due_date, assignee, priority, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(milestone_id, project_id, name, due_date, assignee, priority, position);
  res.json({ id: result.lastInsertRowid, milestone_id, project_id, name, due_date, assignee, priority, completed: false, position });
});

router.put('/:id', (req, res) => {
  const { name, due_date, assignee, priority, completed, position, milestone_id } = req.body;
  db.prepare(
    'UPDATE tasks SET name=?, due_date=?, assignee=?, priority=?, completed=?, position=?, milestone_id=? WHERE id=?'
  ).run(name, due_date, assignee, priority, completed ? 1 : 0, position, milestone_id, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/reorder', (req, res) => {
  const { order } = req.body;
  const update = db.prepare('UPDATE tasks SET position=? WHERE id=?');
  const tx = db.transaction(() => {
    order.forEach((id, idx) => update.run(idx, id));
  });
  tx();
  res.json({ ok: true });
});

module.exports = router;
