// Bundles the gen2 function source into a single self-contained module + package.json that
// `gcloud functions deploy --gen2 --source=build` can build with the Node buildpack.
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const outDir = path.resolve(__dirname, 'build')

mkdirSync(outDir, { recursive: true })

await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: path.resolve(outDir, 'index.js'),
    format: 'cjs',
    sourcemap: false,
    minify: true,
    alias: {
        '@activepieces/shared': path.resolve(repoRoot, 'packages/shared/src'),
        '@activepieces/pieces-framework': path.resolve(repoRoot, 'packages/pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(repoRoot, 'packages/pieces/common/src'),
    },
    // UNSANDBOXED execution never loads isolated-vm; ws works without the optional native addons.
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
})

writeFileSync(path.resolve(outDir, 'package.json'), JSON.stringify({
    name: 'ap-engine-gen2',
    version: '1.0.0',
    main: 'index.js',
    dependencies: {
        '@google-cloud/functions-framework': '^3.4.0',
    },
}, null, 2) + '\n')

// eslint-disable-next-line no-console
console.log('[gen2] build -> deploy/cloud-function-runtime/gen2/build (index.js + package.json)')
