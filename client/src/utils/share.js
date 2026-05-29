export function encodeProjectToUrl(project) {
  const json = JSON.stringify(project);
  const encoded = btoa(encodeURIComponent(json));
  return `${window.location.origin}${window.location.pathname}?shared=${encoded}`;
}

export function decodeProjectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('shared');
  if (!shared) return null;
  try {
    const json = decodeURIComponent(atob(shared));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}
