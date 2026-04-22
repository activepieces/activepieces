import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../../../dist/packages/engine/main.js')
const outdir = path.resolve(__dirname, '../../../dist/packages/engine')

fs.rmSync(outdir, { recursive: true, force: true })

const result = await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: outputPath,
    format: 'cjs',
    sourcemap: true,
    minifySyntax: true,
    minifyWhitespace: true,
    metafile: true,
    alias: {
        '@activepieces/shared/server': path.resolve(__dirname, '../../shared/src/lib/automation/engine/rpc'),
        '@activepieces/shared': path.resolve(__dirname, '../../shared/src'),
        '@activepieces/pieces-framework': path.resolve(__dirname, '../../pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(__dirname, '../../pieces/common/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
})

fs.writeFileSync(outputPath + '.meta.json', JSON.stringify(result.metafile))
