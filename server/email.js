const nodemailer = require('nodemailer');
const db = require('./db');

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function createTransport(settings) {
  if (settings.sendgrid_api_key) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: settings.sendgrid_api_key }
    });
  }
  return nodemailer.createTransport({
    host: settings.smtp_host || 'localhost',
    port: parseInt(settings.smtp_port || '587'),
    secure: settings.smtp_secure === 'true',
    auth: settings.smtp_user ? {
      user: settings.smtp_user,
      pass: settings.smtp_password || ''
    } : undefined
  });
}

function getImpactNote(task, allTasks, milestones) {
  const milestone = milestones.find(m => m.id === task.milestone_id);
  if (!milestone) return '';
  const sibling = allTasks.filter(t =>
    t.milestone_id === task.milestone_id &&
    t.id !== task.id &&
    !t.completed &&
    t.due_date > task.due_date
  );
  if (sibling.length === 0) return '';
  const names = sibling.slice(0, 3).map(t => t.name).join(', ');
  return ` Blocking: ${names}${sibling.length > 3 ? ` and ${sibling.length - 3} more` : ''}.`;
}

async function sendMorningBriefing() {
  const settings = getSettings();
  const toEmail = settings.briefing_email;
  if (!toEmail) return { skipped: true, reason: 'No briefing email configured' };

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const projects = db.prepare('SELECT * FROM projects').all();
  const milestones = db.prepare('SELECT * FROM milestones').all();
  const allTasks = db.prepare('SELECT t.*, m.name as milestone_name, p.name as project_name FROM tasks t JOIN milestones m ON t.milestone_id = m.id JOIN projects p ON t.project_id = p.id WHERE t.completed = 0').all();

  const dueToday = allTasks.filter(t => t.due_date === today);
  const overdue = allTasks.filter(t => t.due_date && t.due_date < today);
  const upcoming = allTasks.filter(t => t.due_date && t.due_date > today && t.due_date <= in7);

  const upcomingByProject = {};
  upcoming.forEach(t => {
    if (!upcomingByProject[t.project_name]) upcomingByProject[t.project_name] = [];
    upcomingByProject[t.project_name].push(t);
  });

  let html = `<div style="font-family:monospace;max-width:600px;margin:0 auto;color:#111">`;
  html += `<h2 style="border-bottom:2px solid #111;padding-bottom:8px">Morning Briefing — ${today}</h2>`;

  if (dueToday.length === 0 && overdue.length === 0 && upcoming.length === 0) {
    html += `<p>Nothing due today or this week. All clear.</p>`;
  }

  if (dueToday.length > 0) {
    html += `<h3>Due Today (${dueToday.length})</h3><ul>`;
    dueToday.forEach(t => {
      html += `<li><strong>${t.name}</strong> — ${t.project_name} / ${t.milestone_name}`;
      if (t.assignee) html += ` [${t.assignee}]`;
      html += ` <em>${t.priority}</em></li>`;
    });
    html += `</ul>`;
  }

  if (overdue.length > 0) {
    html += `<h3 style="color:#cc0000">Overdue (${overdue.length})</h3><ul>`;
    overdue.forEach(t => {
      const impact = getImpactNote(t, allTasks, milestones);
      const daysAgo = Math.floor((Date.now() - new Date(t.due_date)) / 86400000);
      html += `<li><strong>${t.name}</strong> — ${t.project_name} / ${t.milestone_name} (${daysAgo}d overdue)`;
      if (t.assignee) html += ` [${t.assignee}]`;
      if (impact) html += `<br><small style="color:#cc0000">${impact}</small>`;
      html += `</li>`;
    });
    html += `</ul>`;
  }

  if (Object.keys(upcomingByProject).length > 0) {
    html += `<h3>Due This Week</h3>`;
    for (const [proj, tasks] of Object.entries(upcomingByProject)) {
      html += `<h4 style="margin-bottom:4px">${proj}</h4><ul>`;
      tasks.forEach(t => {
        html += `<li>${t.name} — ${t.due_date}`;
        if (t.assignee) html += ` [${t.assignee}]`;
        html += `</li>`;
      });
      html += `</ul>`;
    }
  }

  html += `</div>`;

  const transport = createTransport(settings);
  await transport.sendMail({
    from: settings.smtp_from || settings.briefing_email,
    to: toEmail,
    subject: `Timeline Briefing — ${today}`,
    html
  });

  return { sent: true, to: toEmail };
}

module.exports = { sendMorningBriefing, getSettings };
