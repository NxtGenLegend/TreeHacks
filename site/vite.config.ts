import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': process.env, // Make `process.env` available
  },
  resolve: {
    alias: {
      util: 'util',  // Add util polyfill
    },
  },
});

