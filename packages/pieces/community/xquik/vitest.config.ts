import path from 'path';
import { defineConfig } from 'vitest/config';

const repoRoot = path.resolve(__dirname, '../../../..');

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@activepieces/pieces-common': path.resolve(
        repoRoot,
        'packages/pieces/common/src/index.ts'
      ),
      '@activepieces/pieces-framework': path.resolve(
        repoRoot,
        'packages/pieces/framework/src/index.ts'
      ),
      '@activepieces/shared': path.resolve(
        repoRoot,
        'packages/shared/src/index.ts'
      ),
    },
  },
});
