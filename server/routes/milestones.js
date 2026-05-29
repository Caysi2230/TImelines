const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { project_id, name, target_date = null, color = '#111111', position = 0 } = req.body;
  if (!project_id || !name) return res.status(400).json({ error: 'project_id and name required' });
  const result = db.prepare(
    'INSERT INTO milestones (project_id, name, target_date, color, position) VALUES (?, ?, ?, ?, ?)'
  ).run(project_id, name, target_date, color, position);
  res.json({ id: result.lastInsertRowid, project_id, name, target_date, color, position, collapsed: false, tasks: [] });
});

router.put('/:id', (req, res) => {
  const { name, target_date, color, position, collapsed } = req.body;
  db.prepare(
    'UPDATE milestones SET name=?, target_date=?, color=?, position=?, collapsed=? WHERE id=?'
  ).run(name, target_date, color, position, collapsed ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM milestones WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/reorder', (req, res) => {
  const { order } = req.body;
  const update = db.prepare('UPDATE milestones SET position=? WHERE id=?');
  const tx = db.transaction(() => {
    order.forEach((id, idx) => update.run(idx, id));
  });
  tx();
  res.json({ ok: true });
});

module.exports = router;
