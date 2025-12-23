// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ["localhost"],
  },
  define: {
    global: 'globalThis', // Важно для некоторых пакетов
  },
  resolve: {
    alias: {
      // Polyfill для Buffer
      buffer: 'buffer/',
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
        // Необязательный фикс, если будет ошибка с Buffer.Buffer
        // {
        //   name: 'buffer-fix',
        //   generateBundle() {
        //     this.emitFile({
        //       type: 'asset',
        //       fileName: 'buffer-polyfill.js',
        //       source: 'window.Buffer = window.Buffer || require("buffer").Buffer;',
        //     });
        //   },
        // },
      ],
    },
  },
});