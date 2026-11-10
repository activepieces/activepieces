import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tailwindcss from '@tailwindcss/vite';
import customHtmlPlugin from './vite-plugins/html-plugin';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';
  const emitSourcemap = process.env.AP_BUILD_SOURCEMAP === 'true';

  const AP_TITLE = 'Activepieces';
  const AP_FAVICON = 'https://activepieces.com/favicon.ico';

  return {
    server: {
      // allowedHosts: ['wozcsvaint.loclx.io'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            Host: '127.0.0.1:4200',
          },
          ws: true,
        },
        '/ingest': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
        '^/mcp(/|$)': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/.well-known': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/register': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/authorize': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/token': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/revoke': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/userinfo': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
      },
      port: 4200,
      host: '0.0.0.0',
      warmup: {
        clientFiles: ['./src/main.tsx'],
      },
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
      customHtmlPlugin({
        title: AP_TITLE,
        icon: AP_FAVICON,
      }),
      ...(isDev
        ? [
            checker({
              typescript: {
                buildMode: true,
              },
            }),
          ]
        : []),
    ],

    build: {
      outDir: '../../dist/packages/web',
      emptyOutDir: true,
      reportCompressedSize: false,
      sourcemap: emitSourcemap ? 'hidden' : false,
    },
  };
});
