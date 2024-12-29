import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For Node.js types
/// <reference types="node" />

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});
