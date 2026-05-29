export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dateStr < today();
}

export function isDueToday(dateStr) {
  return dateStr === today();
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(today());
  return Math.ceil(diff / 86400000);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
