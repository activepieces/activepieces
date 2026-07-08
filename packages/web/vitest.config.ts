import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@activepieces/shared': path.resolve(
        __dirname,
        '../../packages/core/shared/src',
      ),
      '@activepieces/core-utils': path.resolve(
        __dirname,
        '../../packages/core/utils/src',
      ),
      '@activepieces/core-piece-types': path.resolve(
        __dirname,
        '../../packages/core/piece-types/src',
      ),
      '@activepieces/core-formula': path.resolve(
        __dirname,
        '../../packages/core/formula/src',
      ),
      '@activepieces/core-execution': path.resolve(
        __dirname,
        '../../packages/core/execution/src',
      ),
      '@activepieces/pieces-framework': path.resolve(
        __dirname,
        '../../packages/pieces/framework/src',
      ),
    },
  },
});
