import path from 'path'
import { fileURLToPath } from 'url'
import * as esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')

await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'smoke.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: path.resolve(__dirname, 'dist/smoke.cjs'),
    format: 'cjs',
    sourcemap: false,
    minify: false,
    alias: {
        '@activepieces/shared': path.resolve(repoRoot, 'packages/shared/src'),
        '@activepieces/server-utils': path.resolve(repoRoot, 'packages/server/utils/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
})

// eslint-disable-next-line no-console
console.log('[smoke] bundle built -> dist/smoke.cjs')
