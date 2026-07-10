import { build } from 'esbuild'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const repoRoot = resolve(packageDir, '../..')
const distDir = resolve(packageDir, 'dist')

// @activepieces/* workspace packages are no longer published to npm, so the published CLI must
// inline them. esbuild resolves them from source via these aliases (mirrors the piece bundler).
const alias = {
    '@activepieces/shared': resolve(repoRoot, 'packages/core/shared/src'),
    '@activepieces/pieces-framework': resolve(repoRoot, 'packages/pieces/framework/src'),
    '@activepieces/pieces-common': resolve(repoRoot, 'packages/pieces/common/src'),
    '@activepieces/core-utils': resolve(repoRoot, 'packages/core/utils/src'),
    '@activepieces/core-piece-types': resolve(repoRoot, 'packages/core/piece-types/src'),
    '@activepieces/core-formula': resolve(repoRoot, 'packages/core/formula/src'),
    '@activepieces/core-execution': resolve(repoRoot, 'packages/core/execution/src'),
}

// esbuild ships a platform-specific native binary, and autocannon loads a .wasm histogram —
// neither inlines cleanly. Keep them external and declare them as the published runtime deps.
const external = ['esbuild', 'autocannon']

mkdirSync(distDir, { recursive: true })

await build({
    entryPoints: [resolve(packageDir, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: resolve(distDir, 'index.js'),
    banner: { js: '#!/usr/bin/env node' },
    alias,
    external,
    logLevel: 'info',
})

const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'))
const publishManifest = {
    name: pkg.name,
    version: pkg.version,
    description: 'Activepieces CLI',
    bin: { 'pieces-cli': 'index.js' },
    files: ['index.js'],
    dependencies: {
        autocannon: pkg.dependencies.autocannon,
        esbuild: pkg.dependencies.esbuild,
    },
    publishConfig: { access: 'public' },
}
writeFileSync(resolve(distDir, 'package.json'), JSON.stringify(publishManifest, null, 2) + '\n')
copyFileSync(resolve(packageDir, 'README.md'), resolve(distDir, 'README.md'))

console.log(`Built publishable CLI bundle at ${distDir}`)
