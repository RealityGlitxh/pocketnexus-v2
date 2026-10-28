/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Opt-in bundle composition report (ANALYZE=1 pnpm build → dist/bundle-report.json).
 * Lists every module in every chunk with its size after tree-shaking (before
 * minification), so initial-JS budget work can target the real contributors.
 */
function bundleReport(): Plugin {
  return {
    name: 'pn-bundle-report',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).flatMap((c) =>
        c.type === 'chunk'
          ? [
              {
                file: c.fileName,
                isEntry: c.isEntry,
                isDynamicEntry: c.isDynamicEntry,
                imports: c.imports,
                modules: Object.entries(c.modules)
                  .map(([id, m]) => ({ id, bytes: m.renderedLength }))
                  .sort((x, y) => y.bytes - x.bytes),
              },
            ]
          : [],
      );
      this.emitFile({
        type: 'asset',
        fileName: 'bundle-report.json',
        source: JSON.stringify(chunks, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.ANALYZE ? [bundleReport()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Fail loudly if a single chunk balloons; the real budget is enforced by
    // scripts/check-bundle-budget.mjs on gzip sizes.
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
});
