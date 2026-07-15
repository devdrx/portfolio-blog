// media.ts — Asset visual media service
// Stores file nodes on Express backend disk storage via the API.

import { authService } from './auth';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number; // in KB
  type: string;
  uploadedAt: string;
}

const API_BASE = '/api';

export const mediaService = {
  // Get all media nodes from Express server
  getMediaFiles: async (): Promise<MediaFile[]> => {
    const res = await fetch(`${API_BASE}/media`);
    if (!res.ok) throw new Error('API_LOAD_ERROR: Could not fetch media archives.');
    return res.json();
  },

  // Upload file as true binary FormData
  uploadFile: async (file: File): Promise<MediaFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/media`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload transaction failed.' }));
      throw new Error(err.error || 'UPLOAD_ERROR');
    }

    const newMedia = await res.json();
    authService.logSystemAction('MEDIA_SYS', `Uploaded asset module: ${newMedia.name} (${newMedia.size} KB)`);
    return newMedia;
  },

  // Delete file node and wipe from backend disk
  deleteFile: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/media/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      authService.logSystemAction('MEDIA_SYS', `Purged asset module: ${id}`);
      return true;
    } catch {
      return false;
    }
  }
};

export const DEFAULT_MEDIA: MediaFile[] = [];
