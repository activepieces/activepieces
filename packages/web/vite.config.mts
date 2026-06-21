/// <reference types='vitest' />
import path from 'path';

import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tailwindcss from '@tailwindcss/vite';
import customHtmlPlugin from './vite-plugins/html-plugin';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';

  const AP_TITLE = 'Activepieces';
  const AP_FAVICON = 'https://activepieces.com/favicon.ico';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/web',
    server: {
      // allowedHosts: ['wozcsvaint.loclx.io'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            Host: '127.0.0.1:4200',
          },
          ws: true,
        },
        '/ingest': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
        },
        '^/mcp(/|$)': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
          rewrite: (p: string) => p,
        },
        '/.well-known': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/register': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/authorize': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/token': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/revoke': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
      },
      port: 4200,
      host: '0.0.0.0',
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },
    resolve: {
      dedupe: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@codemirror/commands',
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@activepieces/shared': path.resolve(
          __dirname,
          '../../packages/core/shared/src',
        ),
        'ee-embed-sdk': path.resolve(
          __dirname,
          '../../packages/ee/embed-sdk/src',
        ),
        '@activepieces/pieces-framework': path.resolve(
          __dirname,
          '../../packages/pieces/framework/src',
        ),
        '@activepieces/core-utils': path.resolve(
          __dirname,
          '../../packages/core/utils/src',
        ),
        '@activepieces/core-formula': path.resolve(
          __dirname,
          '../../packages/core/formula/src',
        ),
        '@activepieces/core-piece-types': path.resolve(
          __dirname,
          '../../packages/core/piece-types/src',
        ),
        '@activepieces/core-execution': path.resolve(
          __dirname,
          '../../packages/core/execution/src',
        ),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      customHtmlPlugin({
        title: AP_TITLE,
        icon: AP_FAVICON,
      }),
      ...(isDev
        ? [
            checker({
              typescript: {
                buildMode: true,
                tsconfigPath: './tsconfig.json',
                root: __dirname,
              },
            }),
          ]
        : []),
    ],

    build: {
      outDir: '../../dist/packages/web',
      emptyOutDir: true,
      reportCompressedSize: true,
      sourcemap: 'hidden',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        onLog(level, log, handler) {
          if (
            log.cause &&
            log.message.includes(`Can't resolve original location of error.`)
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
  };
});
