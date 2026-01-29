import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin'; // Correct import for the plugin entry point

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ssr({
      // For SSG, you might configure page generation here.
      // The default configuration might be sufficient for basic prerendering.
      prerender: true, // Explicitly enable prerendering if needed
      // Other options like pageFiles, etc.
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // commonjsOptions is not needed here as vite-plugin-ssr handles module resolution
  },
  server: {
    host: true,
  },
});