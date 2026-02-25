import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outdir = path.resolve(__dirname, '../../dist/packages/engine')

fs.rmSync(outdir, { recursive: true, force: true })

await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.resolve(__dirname, '../../dist/packages/engine/main.js'),
    format: 'cjs',
    sourcemap: true,
    alias: {
        '@activepieces/shared': path.resolve(__dirname, '../shared/src'),
        '@activepieces/pieces-framework': path.resolve(__dirname, '../pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(__dirname, '../pieces/common/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
})
