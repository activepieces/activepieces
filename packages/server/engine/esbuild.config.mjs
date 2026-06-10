import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../../../dist/packages/engine/main.js')
const outdir = path.resolve(__dirname, '../../../dist/packages/engine')

const watch = process.argv.includes('--watch')

fs.rmSync(outdir, { recursive: true, force: true })

const buildOptions = {
    entryPoints: [path.resolve(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: outputPath,
    format: 'cjs',
    sourcemap: true,
    minify: !watch,
    metafile: true,
    treeShaking: true,
    alias: {
        '@activepieces/shared': path.resolve(__dirname, '../../shared/src'),
        '@activepieces/pieces-framework': path.resolve(__dirname, '../../pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(__dirname, '../../pieces/common/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
    plugins: [
        {
            name: 'engine-rebuild-logger',
            setup(build) {
                let startedAt = 0
                build.onStart(() => {
                    startedAt = Date.now()
                    console.log('[engine] rebuilding…')
                })
                build.onEnd((result) => {
                    if (result.metafile) {
                        fs.writeFileSync(outputPath + '.meta.json', JSON.stringify(result.metafile))
                    }
                    const errors = result.errors?.length ?? 0
                    if (errors > 0) {
                        console.log(`[engine] rebuild failed with ${errors} error(s)`)
                    } else {
                        console.log(`[engine] rebuild done in ${Date.now() - startedAt}ms`)
                    }
                })
            },
        },
    ],
}

if (watch) {
    const ctx = await esbuild.context(buildOptions)
    await ctx.rebuild()
    await ctx.watch()
} else {
    await esbuild.build(buildOptions)
}
