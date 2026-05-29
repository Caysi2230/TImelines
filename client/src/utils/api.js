const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  get: (path) => req('GET', path),
  post: (path, body) => req('POST', path, body),
  put: (path, body) => req('PUT', path, body),
  delete: (path) => req('DELETE', path),

  projects: {
    list: () => api.get('/projects'),
    get: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`)
  },

  milestones: {
    create: (data) => api.post('/milestones', data),
    update: (id, data) => api.put(`/milestones/${id}`, data),
    delete: (id) => api.delete(`/milestones/${id}`),
    reorder: (order) => api.post('/milestones/reorder', { order })
  },

  tasks: {
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    reorder: (order) => api.post('/tasks/reorder', { order })
  },

  settings: {
    get: () => api.get('/settings'),
    save: (data) => api.post('/settings', data)
  },

  ai: {
    generate: (description) => api.post('/ai/generate', { description }),
    improve: (projectId) => api.post(`/ai/improve/${projectId}`)
  },

  email: {
    test: () => api.post('/email/test')
  },

  export: {
    json: (id) => `${BASE}/export/${id}/json`,
    html: (id) => `${BASE}/export/${id}/html`
  }
};
