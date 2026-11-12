import path from 'path'
import { defineConfig } from 'vitest/config'

const repoRoot = path.resolve(__dirname, '../../../..')

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@activepieces/pieces-framework': path.resolve(repoRoot, 'packages/pieces/framework/src/index.ts'),
      '@activepieces/pieces-common': path.resolve(repoRoot, 'packages/pieces/common/src/index.ts'),
    },
  },
})
