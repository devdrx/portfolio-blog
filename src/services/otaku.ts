// otaku.ts — Otaku records API service

import { authService } from './auth';

export interface OtakuRecord {
  id: string;
  title: string;
  type: string;
  rating: number;
  existentialThreat: number;
  note: string;
  coverUrl: string;
  kitsuUrl: string;
  tags: string[];
  accentColor: string;
}

const API_BASE = '/api';

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

export const otakuService = {
  // Get all records from backend
  getRecords: async (): Promise<OtakuRecord[]> => {
    return apiFetch<OtakuRecord[]>('/otaku');
  },

  // Create record via API
  createRecord: async (record: Omit<OtakuRecord, 'id'>): Promise<OtakuRecord> => {
    const newRecord = await apiFetch<OtakuRecord>('/otaku', {
      method: 'POST',
      body: JSON.stringify(record)
    });
    authService.logSystemAction('OTAKU_DB', `Registered otaku record: ${newRecord.title}`);
    return newRecord;
  },

  // Update record via API
  updateRecord: async (id: string, updates: Partial<OtakuRecord>): Promise<OtakuRecord> => {
    const updated = await apiFetch<OtakuRecord>(`/otaku/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    authService.logSystemAction('OTAKU_DB', `Modified otaku record: ${updated.title}`);
    return updated;
  },

  // Delete record via API
  deleteRecord: async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/otaku/${id}`, { method: 'DELETE' });
      authService.logSystemAction('OTAKU_DB', `Deleted otaku record: ${id}`);
      return true;
    } catch {
      return false;
    }
  }
};
