import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static, deploy-anywhere build. If you deploy under a sub-path
// (e.g. GitHub Pages), set base: '/your-repo-name/'.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 1100, // three.js is one large, well-cached chunk
  },
})
