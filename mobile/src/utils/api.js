import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_HOST = 'http://localhost:3000';
const CACHE_KEY = 'timelines_cache';
const HOST_KEY = 'timelines_host';

export async function getHost() {
  const h = await AsyncStorage.getItem(HOST_KEY);
  return h || DEFAULT_HOST;
}

export async function setHost(host) {
  await AsyncStorage.setItem(HOST_KEY, host);
}

async function req(method, path, body) {
  const host = await getHost();
  try {
    const res = await fetch(`${host}/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  } catch (err) {
    throw err;
  }
}

export async function fetchProjects() {
  try {
    const projects = await req('GET', '/projects');
    // Cache for offline
    const full = await Promise.all(projects.map(p => req('GET', `/projects/${p.id}`)));
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(full));
    return full;
  } catch {
    // Offline fallback
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    return [];
  }
}

export async function fetchProject(id) {
  try {
    const project = await req('GET', `/projects/${id}`);
    // Update cache for this project
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const all = cached ? JSON.parse(cached) : [];
    const idx = all.findIndex(p => p.id === id);
    if (idx >= 0) all[idx] = project; else all.push(project);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(all));
    return project;
  } catch {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const all = JSON.parse(cached);
      return all.find(p => p.id === id) || null;
    }
    return null;
  }
}

export async function toggleTask(task) {
  return req('PUT', `/tasks/${task.id}`, { ...task, completed: !task.completed });
}

export const api = { req, fetchProjects, fetchProject, toggleTask };
