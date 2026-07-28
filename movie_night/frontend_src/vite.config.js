import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// This app is built and served by the DjangoApps portfolio site (same
// pattern as the `perfume` app): the build output goes into
// movie_night/assets_build (sibling of this frontend_src/ directory), wired
// into Django's STATICFILES_DIRS under the "movie_night" static namespace,
// and served at /static/movie_night/. A Django template references the
// fixed asset filenames below and is rendered for any request under
// /movie_night/ (see movie_night/views.py).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/static/movie_night/',
  build: {
    outDir: '../assets_build',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: {
    // Kept for quick local iteration (`npm run dev`); not the primary
    // workflow anymore. Proxies API calls to a locally running Django dev
    // server so the session cookie stays same-site.
    proxy: {
      '/movie_night': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
