import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the same build works on localhost and on GitHub Pages
// (https://<user>.github.io/bens-financial-dashboard/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
