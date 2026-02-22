import path from 'path'
import { defineConfig } from 'vitest/config'

// Change CWD to repo root for compatibility with piece-loader path resolution
const repoRoot = path.resolve(__dirname, '../../..')
process.chdir(repoRoot)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 250000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    include: [path.resolve(__dirname, 'test/**/*.test.ts')],
  },
  resolve: {
    alias: {
      'isolated-vm': path.resolve(__dirname, '__mocks__/isolated-vm.js'),
      '@activepieces/shared': path.resolve(__dirname, '../../../packages/shared/src/index.ts'),
      '@activepieces/ee-shared': path.resolve(__dirname, '../../../packages/ee/shared/src/index.ts'),
    },
  },
})
