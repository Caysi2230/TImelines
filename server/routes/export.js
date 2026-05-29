const express = require('express');
const router = express.Router();
const db = require('../db');

function getProjectFull(id) {
  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  if (!project) return null;
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id=? ORDER BY position, id').all(id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id=? ORDER BY position, id').all(id);
  return {
    ...project,
    milestones: milestones.map(m => ({
      ...m,
      tasks: tasks.filter(t => t.milestone_id === m.id)
    }))
  };
}

router.get('/:id/json', (req, res) => {
  const project = getProjectFull(req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });
  res.json(project);
});

router.get('/:id/html', (req, res) => {
  const project = getProjectFull(req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const today = new Date().toISOString().slice(0, 10);

  const milestonesHtml = project.milestones.map(m => {
    const total = m.tasks.length;
    const done = m.tasks.filter(t => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const tasksHtml = m.tasks.map(t => `
      <tr style="opacity:${t.completed ? 0.5 : 1}">
        <td style="padding:6px 12px">${t.completed ? '✓' : '○'} ${t.name}</td>
        <td style="padding:6px 12px">${t.due_date || ''}</td>
        <td style="padding:6px 12px">${t.assignee || ''}</td>
        <td style="padding:6px 12px">${t.priority}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom:32px;border:1px solid #ddd;border-radius:4px;overflow:hidden">
        <div style="background:${m.color || '#111'};color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
          <strong>${m.name}</strong>
          <span>${m.target_date || ''} — ${pct}% complete</span>
        </div>
        <div style="padding:8px 0;background:#fff">
          <div style="height:4px;background:#eee;margin:0 16px 12px">
            <div style="height:4px;background:#111;width:${pct}%"></div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:6px 12px;text-align:left">Task</th>
                <th style="padding:6px 12px;text-align:left">Due</th>
                <th style="padding:6px 12px;text-align:left">Assignee</th>
                <th style="padding:6px 12px;text-align:left">Priority</th>
              </tr>
            </thead>
            <tbody>${tasksHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  const encodedData = Buffer.from(JSON.stringify(project)).toString('base64');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${project.name} — Timeline</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:900px;margin:40px auto;padding:0 20px}
  @media print{body{margin:20px}}
</style>
</head>
<body>
<h1 style="font-size:28px;margin-bottom:4px">${project.name}</h1>
<p style="color:#666;margin-bottom:8px">${project.description || ''}</p>
<p style="font-size:12px;color:#999">Exported ${today}</p>
${milestonesHtml}
<script>
// Project data encoded for offline use
window.__PROJECT_DATA__ = ${JSON.stringify(project)};
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}.html"`);
  res.send(html);
});

module.exports = router;
