const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json(projects);
});

router.post('/', (req, res) => {
  const { name, description = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)').run(name, description);
  res.json({ id: result.lastInsertRowid, name, description });
});

router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id=? ORDER BY position, id').all(project.id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id=? ORDER BY position, id').all(project.id);

  res.json({
    ...project,
    milestones: milestones.map(m => ({
      ...m,
      collapsed: m.collapsed === 1,
      tasks: tasks.filter(t => t.milestone_id === m.id).map(t => ({
        ...t,
        completed: t.completed === 1
      }))
    }))
  });
});

router.put('/:id', (req, res) => {
  const { name, description } = req.body;
  db.prepare('UPDATE projects SET name=?, description=?, updated_at=datetime("now") WHERE id=?')
    .run(name, description, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
