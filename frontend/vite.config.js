import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    open: '/frontend/index.html'
  },
  build: {
    outDir: 'dist',
  },
  root: './',
  publicDir: 'assets',
  resolve: {
    alias: {
      '@assets': '/assets',
      '@components': '/components',
      '@charts': '/charts',
    },
  },
});
