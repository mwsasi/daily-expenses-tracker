import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Injects the API key from the environment into the application
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  // Use esbuild for dropping console and debugger instead of terser to fix type errors.
  // Esbuild is the default minifier in modern Vite and offers better performance.
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Using esbuild for minification to ensure compatibility and performance
    minify: 'esbuild',
  }
});