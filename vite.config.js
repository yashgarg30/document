import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for pdfjs worker loading in Vite
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min.js'],
  },
  define: {
    'process.env': {},
  },
});
