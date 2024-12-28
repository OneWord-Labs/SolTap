
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      clientPort: 443,
      host: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co',
      protocol: 'wss'
    }
  }
});
