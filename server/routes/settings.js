const express = require('express');
const router = express.Router();
const db = require('../db');

const SAFE_KEYS = [
  'briefing_email', 'smtp_host', 'smtp_port', 'smtp_secure',
  'smtp_user', 'smtp_password', 'smtp_from', 'sendgrid_api_key', 'anthropic_api_key'
];

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const safe = Object.fromEntries(
    SAFE_KEYS.map(k => [k, settings[k] || ''])
  );
  // Mask secrets in response
  if (safe.smtp_password) safe.smtp_password = '••••••••';
  if (safe.sendgrid_api_key) safe.sendgrid_api_key = '••••••••';
  if (safe.anthropic_api_key) safe.anthropic_api_key = '••••••••';
  res.json(safe);
});

router.post('/', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(req.body)) {
      if (SAFE_KEYS.includes(key) && value !== '••••••••') {
        upsert.run(key, value);
      }
    }
  });
  tx();
  res.json({ ok: true });
});

module.exports = router;
