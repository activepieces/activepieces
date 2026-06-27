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

  // Dev port overrides so multiple worktrees can run side by side (defaults match prod/CI).
  const WEB_PORT = Number(process.env.AP_DEV_WEB_PORT) || 4200;
  const API_TARGET = `http://127.0.0.1:${process.env.AP_DEV_API_PORT || 3000}`;
  const WEB_PROXY_HOST = `127.0.0.1:${WEB_PORT}`;
  const WEB_ORIGIN_HOST = `localhost:${WEB_PORT}`;

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/web',
    server: {
      // allowedHosts: ['wozcsvaint.loclx.io'],
      proxy: {
        '/api': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            Host: WEB_PROXY_HOST,
          },
          ws: true,
        },
        '/ingest': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
        },
        '^/mcp(/|$)': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': WEB_ORIGIN_HOST,
          },
          rewrite: (p: string) => p,
        },
        '/.well-known': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': WEB_ORIGIN_HOST,
          },
        },
        '/register': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': WEB_ORIGIN_HOST,
          },
        },
        '/authorize': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': WEB_ORIGIN_HOST,
          },
        },
        '/token': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': WEB_ORIGIN_HOST,
          },
        },
        '/revoke': {
          target: API_TARGET,
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': WEB_ORIGIN_HOST,
          },
        },
      },
      port: WEB_PORT,
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
