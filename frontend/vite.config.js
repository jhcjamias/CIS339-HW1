import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Backend endpoints that the dev server forwards to Express on port 3000.
const API_ROUTES = ['/find-student', '/add-student', '/delete-student', '/api'];
const BACKEND_URL = 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: Object.fromEntries(API_ROUTES.map((route) => [route, BACKEND_URL])),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
