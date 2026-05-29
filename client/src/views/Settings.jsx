import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState({
    briefing_email: '', smtp_host: '', smtp_port: '587', smtp_secure: 'false',
    smtp_user: '', smtp_password: '', smtp_from: '', sendgrid_api_key: '', anthropic_api_key: ''
  });
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.settings.get().then(s => { setSettings(prev => ({ ...prev, ...s })); setLoading(false); });
  }, []);

  function set(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    await api.settings.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testEmail() {
    setTesting(true);
    setTestResult('');
    try {
      const res = await api.email.test();
      setTestResult(res.skipped ? `Skipped: ${res.reason}` : `✓ Sent to ${res.to}`);
    } catch (e) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--gray-400)' }}>Loading…</div>;

  return (
    <div>
      <div className="view-header">
        <h1>Settings</h1>
        <button className="btn-primary" onClick={save}>{saved ? '✓ Saved' : 'Save Settings'}</button>
      </div>
      <div className="view-content" style={{ maxWidth: 600 }}>

        <div className="settings-section">
          <h2 className="settings-section-title">AI Configuration</h2>
          <p className="settings-desc">Required for AI timeline generation. Get a key at console.anthropic.com.</p>
          <div className="form-row">
            <label>Anthropic API Key</label>
            <input
              type="password"
              value={settings.anthropic_api_key}
              onChange={e => set('anthropic_api_key', e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Morning Email Briefing</h2>
          <p className="settings-desc">Receive a daily email at 7am with tasks due today, this week, and overdue items.</p>
          <div className="form-row">
            <label>Send briefing to</label>
            <input
              type="email"
              value={settings.briefing_email}
              onChange={e => set('briefing_email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-row">
            <label>From address (optional)</label>
            <input
              type="email"
              value={settings.smtp_from}
              onChange={e => set('smtp_from', e.target.value)}
              placeholder="timelines@example.com"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Email Delivery</h2>

          <div className="form-row">
            <label>SendGrid API Key (recommended)</label>
            <input
              type="password"
              value={settings.sendgrid_api_key}
              onChange={e => set('sendgrid_api_key', e.target.value)}
              placeholder="SG...."
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'flex', align: 'center', gap: 12, color: 'var(--gray-400)', fontSize: 12, margin: '8px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)', alignSelf: 'center' }} />
            <span>or configure SMTP</span>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)', alignSelf: 'center' }} />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>SMTP Host</label>
              <input value={settings.smtp_host} onChange={e => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div className="form-row">
              <label>Port</label>
              <input value={settings.smtp_port} onChange={e => set('smtp_port', e.target.value)} placeholder="587" />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Username</label>
              <input value={settings.smtp_user} onChange={e => set('smtp_user', e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input type="password" value={settings.smtp_password} onChange={e => set('smtp_password', e.target.value)} placeholder="••••••••" autoComplete="off" />
            </div>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={settings.smtp_secure === 'true'}
                onChange={e => set('smtp_secure', e.target.checked ? 'true' : 'false')}
                style={{ width: 'auto', marginRight: 6 }}
              />
              Use SSL/TLS (port 465)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            <button className="btn-secondary" onClick={testEmail} disabled={testing}>
              {testing ? 'Sending…' : 'Send Test Email Now'}
            </button>
            {testResult && <span style={{ fontSize: 13, color: testResult.startsWith('✓') ? 'var(--success)' : 'var(--danger)' }}>{testResult}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
