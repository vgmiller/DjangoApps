// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/static/perfume/',
    build: {
        manifest: false,
        outDir: 'assets_build',
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
})