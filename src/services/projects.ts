// projects.ts — Projects record service
// All project archives live on the backend in server/data/projects.json.

import { authService } from './auth';

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  order: number;
  featured: boolean;
  visibility: 'visible' | 'hidden';
}

const API_BASE = '/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Projects Service ─────────────────────────────────────────────────────────
export const projectsService = {
  // Get projects from API
  getProjects: async (options?: { includeHidden?: boolean }): Promise<Project[]> => {
    const qs = options?.includeHidden ? '?hidden=true' : '';
    return apiFetch<Project[]>(`/projects${qs}`);
  },

  // Create project via API
  createProject: async (project: Omit<Project, 'id'>): Promise<Project> => {
    const newProject = await apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
    authService.logSystemAction('PROJ_DB', `Registered project: ${newProject.title}`);
    return newProject;
  },

  // Update project via API
  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const updated = await apiFetch<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    authService.logSystemAction('PROJ_DB', `Modified project: ${updated.title}`);
    return updated;
  },

  // Delete project via API
  deleteProject: async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      authService.logSystemAction('PROJ_DB', `Deleted project node: ${id}`);
      return true;
    } catch {
      return false;
    }
  }
};

export const DEFAULT_PROJECTS: Project[] = [];
