import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      // Package "main" points at dist/, which is not built in this checkout.
      '@activepieces/pieces-framework': path.resolve(repoRoot, 'packages/pieces/framework/src/index.ts'),
      '@activepieces/pieces-common': path.resolve(repoRoot, 'packages/pieces/common/src/index.ts'),
      '@activepieces/core-utils': path.resolve(repoRoot, 'packages/core/utils/src/index.ts'),
      '@activepieces/core-piece-types': path.resolve(repoRoot, 'packages/core/piece-types/src/index.ts'),
    },
  },
})
