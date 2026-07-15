// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept native fetch to automatically attach authorization header to admin requests
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const token = sessionStorage.getItem('yorha_session_token');
  
  if (token && url.startsWith('/api/') && !url.includes('/api/auth/login') && !url.includes('/api/auth/setup')) {
    if (input instanceof Request) {
      input.headers.set('Authorization', `Bearer ${token}`);
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
  return originalFetch.call(this, input, init);
};

createRoot(document.getElementById('root')!).render(
  <App />
)
