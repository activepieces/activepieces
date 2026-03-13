import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 30000,
        include: [path.resolve(__dirname, 'test/**/*.test.ts')],
    },
    resolve: {
        alias: {
            '@activepieces/shared': path.resolve(__dirname, '../../../packages/shared/src/index.ts'),
            '@activepieces/sandbox': path.resolve(__dirname, './src/index.ts'),
        },
    },
})
