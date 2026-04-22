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
    minify: true,
    metafile: true,
    treeShaking: true,
    alias: {
        '@activepieces/shared': path.resolve(__dirname, '../../shared/src'),
        '@activepieces/pieces-framework': path.resolve(__dirname, '../../pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(__dirname, '../../pieces/common/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
    plugins: [
        // socket.io-client / engine.io-client ship an `esm-debug` build under
        // their `node` export condition that inlines the full `debug` library.
        // Rewrite loaded files from `esm-debug` to the non-debug `esm` build
        // (same public API) so the bundle skips `debug` and its helpers.
        {
            name: 'socket-io-esm-non-debug',
            setup(build) {
                build.onLoad({ filter: /\/(socket\.io-client|engine\.io-client|socket\.io-parser)\/build\/esm-debug\// }, async (args) => {
                    const { promises: fs } = await import('fs')
                    const rewritten = args.path.replace('/build/esm-debug/', '/build/esm/')
                    const contents = await fs.readFile(rewritten, 'utf8')
                    return { contents, loader: 'js' }
                })
            },
        },
    ],
})

fs.writeFileSync(outputPath + '.meta.json', JSON.stringify(result.metafile))
