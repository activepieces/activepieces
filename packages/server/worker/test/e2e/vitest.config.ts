import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 60_000,
    hookTimeout: 60_000,
    include: [path.resolve(__dirname, '*.e2e.test.ts')],
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@activepieces/shared': path.resolve(__dirname, '../../../../../packages/shared/src/index.ts'),
      '@activepieces/pieces-framework': path.resolve(__dirname, '../../../../../packages/pieces/framework/src/index.ts'),
      '@activepieces/server-utils': path.resolve(__dirname, '../../../../../packages/server/utils/src/index.ts'),
    },
  },
})
