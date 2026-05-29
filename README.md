# Timelines

A local project timeline manager with AI-powered planning, Gantt views, and morning email briefings.

## Quick Start

```bash
npm install
npm start
```

The app opens automatically at http://localhost:3001 (frontend) backed by an API on port 3000.

## Configuration

All configuration is done through the **Settings** panel in the app (sidebar → Settings).

### Anthropic API Key (for AI features)

1. Get a key at [console.anthropic.com](https://console.anthropic.com)
2. Open Settings → AI Configuration → paste your key

Or set it via environment variable:
```bash
cp .env.example .env
# Edit .env and add your key
```

### Email Briefing

The app sends a daily briefing at 7am with:
- Tasks due today
- Tasks due this week (grouped by project)
- Overdue tasks with downstream impact notes

Configure in Settings → Morning Email Briefing.

**Option A — SendGrid (recommended):**
1. Create a free account at sendgrid.com
2. Generate an API key
3. Paste into Settings → SendGrid API Key

**Option B — SMTP:**
Configure host, port, username and password. Works with Gmail (use App Passwords), Outlook, or any SMTP server.

To test immediately: Settings → "Send Test Email Now"

## Features

- **Projects** — create with name and description
- **Milestones** — colour-coded with target dates, drag to reorder, expand/collapse
- **Tasks** — due dates, assignees, priorities (low/medium/high), drag to reorder, mark complete
- **Dashboard** — overall progress, overdue tasks, due today, due this week
- **List view** — full project with milestone progress bars
- **Timeline/Gantt** — horizontal date axis showing milestones and tasks
- **AI generation** — describe your project, Claude generates a full milestone + task plan
- **AI improvement** — "Improve this timeline" sends your existing project to Claude for gap analysis
- **Export to HTML** — self-contained file anyone can open in a browser
- **Export to PDF** — print-friendly via browser print (Ctrl+P / Cmd+P)
- **Shareable link** — encodes project data in the URL, no login required

## Mobile App

See [mobile/README.md](mobile/README.md) for the React Native / Expo companion app.

## Data

Project data is stored in `data/timelines.db` (SQLite). Back this file up to preserve your projects.

## Development

```bash
# Run backend only
npm run server

# Run frontend only (requires backend running)
npm run client
```
