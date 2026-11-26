import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// The dev server forwards all /api requests to Express on port 3000.
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
    proxy: { '/api': BACKEND_URL },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
