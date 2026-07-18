// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept native fetch to automatically attach authorization header and rewrite base URLs
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const token = sessionStorage.getItem('yorha_session_token');
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''); // strip trailing slash
  let updatedInput = input;

  if (url.startsWith('/api/')) {
    const targetUrl = `${apiBase}${url}`;
    if (typeof input === 'string') {
      updatedInput = targetUrl;
    } else if (input instanceof URL) {
      updatedInput = new URL(targetUrl);
    } else if (input instanceof Request) {
      updatedInput = new Request(targetUrl, input);
    }
    url = targetUrl;
  }
  
  if (token && url.includes('/api/') && !url.includes('/api/auth/login') && !url.includes('/api/auth/setup')) {
    if (updatedInput instanceof Request) {
      updatedInput.headers.set('Authorization', `Bearer ${token}`);
    } else {
      init = init || {};
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        init.headers.set('Authorization', `Bearer ${token}`);
      } else if (Array.isArray(init.headers)) {
        const authIdx = init.headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
        if (authIdx > -1) {
          init.headers[authIdx][1] = `Bearer ${token}`;
        } else {
          init.headers.push(['Authorization', `Bearer ${token}`]);
        }
      } else {
        (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch.call(this, updatedInput, init);
};

createRoot(document.getElementById('root')!).render(
  <App />
)
