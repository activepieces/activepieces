/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';

  return {
    root: resolve(__dirname, '.'),
    cacheDir: resolve(__dirname, '../../node_modules/.vite/react-ui'),
    publicDir: resolve(__dirname, 'public'),
    resolve: {
      alias: {
        '@activepieces/shared': resolve(__dirname, '../shared/src')
      }
    },
    
    plugins: [
      react(),
      nxViteTsPaths(),
    ],
    
    server: {
      port: 4200,
      host: '0.0.0.0',
      open: true,
      fs: { allow: ['..'] },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    
    build: {
      outDir: resolve(__dirname, '../../dist/packages/react-ui'),
      emptyOutDir: true,
      reportCompressedSize: true,
      minify: !isDev ? 'esbuild' : false,
      sourcemap: isDev,
      commonjsOptions: { transformMixedEsModules: true },
    },
    
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.{js,mjs,cjs,ts,mts,cts,tsx}'],
      cache: { dir: resolve(__dirname, '../../node_modules/.vitest') },
    },
    
    define: { 'process.env': {} },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@activepieces/shared',
      ],
    },
  };
});
