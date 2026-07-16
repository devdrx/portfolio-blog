import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get current git commit hash (short version)
let commitHash = 'dev-local';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('Could not read git commit hash:', e);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  server: {
    proxy: {
      // Forward /api requests to the Express backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            if (id.includes('highlight.js')) {
              return 'vendor-highlight';
            }
            if (id.includes('marked')) {
              return 'vendor-marked';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})
