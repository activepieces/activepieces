import path from 'path'
import { defineConfig } from 'vitest/config'

// Change CWD to repo root for compatibility with piece-loader path resolution
const repoRoot = path.resolve(__dirname, '../../..')
process.chdir(repoRoot)

process.env.AP_EXECUTION_MODE = 'UNSANDBOXED'
process.env.AP_BASE_CODE_DIRECTORY = 'packages/server/engine/test/resources/codes'
process.env.AP_TEST_MODE = 'true'
process.env.AP_DEV_PIECES = 'http,data-mapper,approval,webhook,delay'

export default defineConfig({
  // esbuild injects this at bundle time; vitest runs the source directly, so define it here too.
  // Tests exercise the proxy-included path (the no-proxy bundle's behaviour is the build-flag flip).
  define: {
    __AP_PROXY_DISPATCHER__: 'true',
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    include: [path.resolve(__dirname, 'test/**/*.test.ts')],
  },
  resolve: {
    alias: {
      '@activepieces/shared': path.resolve(__dirname, '../../../packages/core/shared/src/index.ts'),
      '@activepieces/pieces-framework': path.resolve(__dirname, '../../../packages/pieces/framework/src/index.ts'),
      '@activepieces/pieces-common': path.resolve(__dirname, '../../../packages/pieces/common/src/index.ts'),
      '@activepieces/core-formula': path.resolve(__dirname, '../../../packages/core/formula/src/index.ts'),
    },
  },
})
