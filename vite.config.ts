// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ["localhost"],
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          auth: ['@privy-io/react-auth'],
          ethers: ['ethers'],
        },
      },
      plugins: [
        nodePolyfills({ buffer: true }), // ← Ключевая строка
      ],
    },
  },
});