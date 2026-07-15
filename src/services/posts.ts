// posts.ts — Blog post service
// All data lives server-side in server/data/posts.json via the Express API.
// localStorage is no longer used for post storage.

import { authService } from './auth';

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
  status: 'draft' | 'published';
  tags?: string[];
  slug?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
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

// ─── Posts Service ────────────────────────────────────────────────────────────
export const postsService = {
  // List all posts — drafts only visible when includeDrafts = true
  getPosts: async (options?: { includeDrafts?: boolean }): Promise<BlogPost[]> => {
    const qs = options?.includeDrafts ? '?drafts=true' : '';
    return apiFetch<BlogPost[]>(`/posts${qs}`);
  },

  // Single post by id
  getPost: async (id: string): Promise<BlogPost | null> => {
    try {
      return await apiFetch<BlogPost>(`/posts/${id}`);
    } catch {
      return null;
    }
  },

  // Create a new post
  createPost: async (post: Omit<BlogPost, 'id' | 'date'>): Promise<BlogPost> => {
    const newPost = await apiFetch<BlogPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
    authService.logSystemAction('POST_DB', `Created log: ${newPost.title}`);
    return newPost;
  },

  // Full update of an existing post
  updatePost: async (id: string, updates: Partial<BlogPost>): Promise<BlogPost> => {
    const updated = await apiFetch<BlogPost>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    authService.logSystemAction('POST_DB', `Modified log: ${updated.title}`);
    return updated;
  },

  // Delete a single post
  deletePost: async (id: string): Promise<boolean> => {
    try {
      const post = await postsService.getPost(id);
      await apiFetch(`/posts/${id}`, { method: 'DELETE' });
      authService.logSystemAction('POST_DB', `Purged log: ${post?.title ?? id}`);
      return true;
    } catch {
      return false;
    }
  },

  // Bulk status toggle (publish / draft)
  bulkUpdateStatus: async (ids: string[], status: 'draft' | 'published'): Promise<void> => {
    await apiFetch('/posts/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    });
    authService.logSystemAction('POST_DB', `Bulk updated ${ids.length} records status to ${status}.`);
  },

  // Bulk delete
  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiFetch('/posts/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    authService.logSystemAction('POST_DB', `Bulk purged ${ids.length} records.`);
  },
};

export const DEFAULT_POSTS: BlogPost[] = [];
