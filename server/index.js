require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/export', require('./routes/export'));
app.use('/api/email', require('./routes/email'));

// Serve built frontend in production; in dev, Vite proxy handles it
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n  Timeline server running at http://localhost:${PORT}\n`);
  if (process.env.NODE_ENV !== 'production') {
    const { exec } = require('child_process');
    const url = 'http://localhost:3001';
    const cmd = process.platform === 'darwin' ? `open ${url}` :
                process.platform === 'win32' ? `start ${url}` : `xdg-open ${url}`;
    exec(cmd, () => {});
  }
});

require('./cron').startCron();
