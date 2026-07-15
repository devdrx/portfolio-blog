// Custom interface for simulated JWT payload
interface SessionPayload {
  userId: string;
  role: string;
  exp: number;
}

const SESSION_KEY = 'yorha_session_token';

export const authService = {
  // Check if system master access key has been configured
  checkSetupStatus: async (): Promise<{ initialized: boolean }> => {
    const res = await fetch('/api/auth/status');
    if (!res.ok) throw new Error('API_AUTH_ERROR: Could not fetch setup status.');
    return res.json();
  },

  // Setup master access key for the first time
  setup: async (password: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem(SESSION_KEY, data.token);
        authService.logSystemAction('AUTH_DAEMON', 'Database console initialized and master key registered.');
        return { success: true, token: data.token };
      }
      return { success: false, error: data.error || 'Failed initialization.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'API connection failed.' };
    }
  },

  // Login verification
  login: async (password: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem(SESSION_KEY, data.token);
        authService.logSystemAction('AUTH_DAEMON', 'Maintenance console unlocked by admin.');
        return { success: true, token: data.token };
      }
      authService.logSystemAction('AUTH_DAEMON', 'ALERT: Failed maintenance access attempt.', true);
      return { success: false, error: data.error || 'SECURITY REJECTION: Access key mismatch.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'API connection failed.' };
    }
  },

  // Logout session clear
  logout: async (): Promise<void> => {
    sessionStorage.removeItem(SESSION_KEY);
    authService.logSystemAction('AUTH_DAEMON', 'Maintenance console locked.');
  },

  // Verify active session token status
  verifySession: (): boolean => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return false;
    try {
      const decoded: SessionPayload = JSON.parse(atob(token));
      const expired = Date.now() > decoded.exp;
      if (expired) {
        sessionStorage.removeItem(SESSION_KEY);
        authService.logSystemAction('AUTH_DAEMON', 'Session expired automatically.', true);
        return false;
      }
      return decoded.role === 'admin';
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
  },

  // Fetch session details
  getSessionExpiry: (): number => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return 0;
    try {
      const decoded: SessionPayload = JSON.parse(atob(token));
      return Math.max(0, Math.ceil((decoded.exp - Date.now()) / 1000));
    } catch {
      return 0;
    }
  },

  // Change administrative access key later from within the admin dashboard
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return { success: false, error: 'Session token missing. Log in again.' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        authService.logSystemAction('AUTH_DAEMON', 'Admin access key rotated successfully.');
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to rotate access key.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'API connection failed.' };
    }
  },

  // Fetch system dashboard metrics from Express API server
  getStats: async (): Promise<{
    postsCount: number;
    draftsCount: number;
    projectsCount: number;
    mediaCount: number;
    mediaSizeKB: number;
    health: string;
    lastBackup: string;
  }> => {
    const res = await fetch('/api/settings/stats');
    if (!res.ok) throw new Error('API_STATS_ERROR: Could not load diagnostic dashboard.');
    return res.json();
  },

  // Helper system logger to store logs on the backend
  logSystemAction: (module: string, message: string, isAlert = false) => {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, message, isAlert })
    }).catch(err => console.error('Failed logging action:', err));
  }
};
