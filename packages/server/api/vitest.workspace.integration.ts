import path from 'path'
import { defineWorkspace } from 'vitest/config'

const apiDir = __dirname
const repoRoot = path.resolve(apiDir, '../../..')

const sharedResolve = {
    alias: {
        'isolated-vm': path.resolve(apiDir, '__mocks__/isolated-vm.js'),
        '@activepieces/shared': path.resolve(repoRoot, 'packages/shared/src/index.ts'),
        '@activepieces/pieces-framework': path.resolve(repoRoot, 'packages/pieces/framework/src/index.ts'),
        '@activepieces/pieces-common': path.resolve(repoRoot, 'packages/pieces/common/src/index.ts'),
        '@activepieces/server-utils': path.resolve(repoRoot, 'packages/server/utils/src/index.ts'),
        '@activepieces/piece-slack': path.resolve(repoRoot, 'packages/pieces/community/slack/src/index.ts'),
        '@activepieces/piece-intercom': path.resolve(repoRoot, 'packages/pieces/community/intercom/src/index.ts'),
        '@activepieces/piece-square': path.resolve(repoRoot, 'packages/pieces/community/square/src/index.ts'),
        '@activepieces/piece-facebook-leads': path.resolve(repoRoot, 'packages/pieces/community/facebook-leads/src/index.ts'),
    },
}

const sharedTestConfig = {
    globals: true as const,
    environment: 'node' as const,
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks' as const,
    setupFiles: [path.resolve(apiDir, 'vitest.setup.ts')],
}

export default defineWorkspace([
    {
        test: {
            ...sharedTestConfig,
            name: 'ce',
            include: [path.resolve(apiDir, 'test/integration/ce/**/*.test.ts')],
            env: { AP_EDITION: 'ce' },
        },
        resolve: sharedResolve,
    },
    {
        test: {
            ...sharedTestConfig,
            name: 'ee',
            include: [path.resolve(apiDir, 'test/integration/ee/**/*.test.ts')],
            env: { AP_EDITION: 'ee' },
        },
        resolve: sharedResolve,
    },
    {
        test: {
            ...sharedTestConfig,
            name: 'cloud',
            include: [path.resolve(apiDir, 'test/integration/cloud/**/*.test.ts')],
            env: { AP_EDITION: 'cloud' },
        },
        resolve: sharedResolve,
    },
])
