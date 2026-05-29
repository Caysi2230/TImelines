const Anthropic = require('@anthropic-ai/sdk');
const db = require('./db');

function getClient() {
  const row = db.prepare("SELECT value FROM settings WHERE key='anthropic_api_key'").get();
  const apiKey = row?.value || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No Anthropic API key configured. Add it in Settings.');
  return new Anthropic({ apiKey });
}

async function generateTimeline(description) {
  const client = getClient();
  const today = new Date().toISOString().slice(0, 10);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a project planning assistant. Generate a structured project timeline from this description.

Today's date: ${today}

Project description: ${description}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "project_name": "string",
  "project_description": "string",
  "milestones": [
    {
      "name": "string",
      "target_date": "YYYY-MM-DD",
      "color": "#hexcolor",
      "tasks": [
        {
          "name": "string",
          "due_date": "YYYY-MM-DD",
          "assignee": "",
          "priority": "low|medium|high"
        }
      ]
    }
  ]
}

Rules:
- Work dates backwards from any end date mentioned, or assume 3 months from today if none given
- Use distinct colors per milestone (e.g. #1a1a1a, #444444, #888888, #bbbbbb for B&W theme, or subtle colors)
- Be specific and practical with task names
- Include 3-7 milestones with 3-8 tasks each
- Ensure tasks are ordered logically within each milestone`
    }]
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid response');
  return JSON.parse(jsonMatch[0]);
}

async function improveTimeline(projectId) {
  const client = getClient();
  const today = new Date().toISOString().slice(0, 10);

  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(projectId);
  if (!project) throw new Error('Project not found');

  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id=? ORDER BY position').all(projectId);
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id=? ORDER BY position').all(projectId);

  const structure = milestones.map(m => ({
    id: m.id,
    name: m.name,
    target_date: m.target_date,
    tasks: tasks.filter(t => t.milestone_id === m.id).map(t => ({
      id: t.id,
      name: t.name,
      due_date: t.due_date,
      assignee: t.assignee,
      priority: t.priority,
      completed: t.completed === 1
    }))
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a project planning expert reviewing an existing project timeline.

Today's date: ${today}
Project: ${project.name}
Description: ${project.description}

Current timeline:
${JSON.stringify(structure, null, 2)}

Identify issues and improvements. Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "id": "unique_string",
      "type": "gap|dependency|timing|missing_task|missing_milestone|reorder",
      "severity": "warning|info",
      "title": "short title",
      "description": "plain english explanation of the issue",
      "action": "what to do about it",
      "target_id": null or milestone/task id this refers to
    }
  ]
}

Focus on:
- Missing tasks or milestones that are typically needed
- Unrealistic date gaps (too rushed or too much slack)
- Dependencies that should be explicit
- Tasks that lack assignees when others have them
- Logical ordering issues`
    }]
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid response');
  return JSON.parse(jsonMatch[0]);
}

module.exports = { generateTimeline, improveTimeline };
