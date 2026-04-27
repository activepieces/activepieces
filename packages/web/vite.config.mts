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

  const AP_TITLE = 'otom8';
  // Neutral transparent favicon data URI; runtime branding is applied by the
  // dynamic theme (theme-patched.js / websiteBranding). Keeps AP's default
  // favicon.ico off the network and out of the browser tab.
  const AP_FAVICON =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%230A0A0A"/><text x="16" y="22" font-family="Georgia, serif" font-size="18" font-weight="300" text-anchor="middle" fill="%2310B981">o</text></svg>';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/web',
    server: {
      // allowedHosts: ['wozcsvaint.loclx.io'],
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            Host: '127.0.0.1:4200',
          },
          ws: true,
        },
        '^/mcp$': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          rewrite: (p: string) => p,
        },
        '/.well-known': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
        },
        '/register': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
        },
        '/authorize': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
        },
        '/token': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
        },
        '/revoke': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
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
          '../../packages/shared/src',
        ),
        'ee-embed-sdk': path.resolve(
          __dirname,
          '../../packages/ee/embed-sdk/src',
        ),
        '@activepieces/pieces-framework': path.resolve(
          __dirname,
          '../../packages/pieces/framework/src',
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
