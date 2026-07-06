import * as esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '..')
const COMMUNITY = path.join(REPO, 'packages', 'pieces', 'community')
const WORKSPACE_ALIASES = {
    '@activepieces/shared': path.join(REPO, 'packages', 'shared', 'src'),
    '@activepieces/pieces-framework': path.join(REPO, 'packages', 'pieces', 'framework', 'src'),
    '@activepieces/pieces-common': path.join(REPO, 'packages', 'pieces', 'common', 'src'),
    '@activepieces/core-utils': path.join(REPO, 'packages', 'core', 'utils', 'src'),
    '@activepieces/core-piece-types': path.join(REPO, 'packages', 'core', 'piece-types', 'src'),
}
const NATIVE_EXTERNALS = new Set(['oracledb', 'duckdb', 'better-sqlite3', 'sqlite3', 'pg-native', 'mongodb-client-encryption', 'kerberos', 'snappy', 'aws4', 'bson-ext', '@mongodb-js/zstd', 'playwright', 'playwright-core', 'puppeteer', 'puppeteer-core'])

function pkgOf(file) {
    let m = file.match(/\.bun\/((@[^/]+\/)?[^@/]+)@/)
    if (m) {
        // distinguish full zod from zod/mini
        if (m[1] === 'zod') return /\/mini\//.test(file) || /\/v4\/mini\//.test(file) ? 'zod/mini' : 'zod(full)'
        return m[1]
    }
    if (/packages\/shared\//.test(file)) return '@activepieces/shared'
    if (/packages\/pieces\/common\//.test(file)) return '@activepieces/pieces-common'
    if (/packages\/pieces\/framework\//.test(file)) return '@activepieces/pieces-framework'
    return 'piece-src/other-ws'
}

const pieces = fs.readdirSync(COMMUNITY).filter((d) => fs.existsSync(path.join(COMMUNITY, d, 'package.json')))
const totalByPkg = {}
const piecesByPkg = {}
let okCount = 0
for (const p of pieces) {
    const entry = path.join(COMMUNITY, p, 'src', 'index.ts')
    if (!fs.existsSync(entry)) continue
    const pj = JSON.parse(fs.readFileSync(path.join(COMMUNITY, p, 'package.json'), 'utf8'))
    const external = Object.keys(pj.dependencies || {}).filter((d) => NATIVE_EXTERNALS.has(d))
    let res
    try {
        res = await esbuild.build({
            entryPoints: [entry], bundle: true, platform: 'node', target: 'node20', format: 'cjs',
            write: false, outdir: '/tmp/ap-agg-out', minify: true, treeShaking: true, metafile: true,
            logLevel: 'silent', alias: WORKSPACE_ALIASES, external, loader: { '.node': 'file' },
        })
    } catch { continue }
    okCount++
    const out = Object.values(res.metafile.outputs)[0]
    const seen = new Set()
    for (const [file, v] of Object.entries(out.inputs)) {
        const k = pkgOf(file)
        totalByPkg[k] = (totalByPkg[k] || 0) + v.bytesInOutput
        if (!seen.has(k)) { piecesByPkg[k] = (piecesByPkg[k] || 0) + 1; seen.add(k) }
    }
}
const MB = 1024 * 1024, KB = 1024
const ranked = Object.entries(totalByPkg).sort((a, b) => b[1] - a[1]).slice(0, 30)
console.log(`\nCatalog-wide bundled bytes by package (${okCount} pieces)\n`)
console.log('TOTAL'.padStart(9), 'IN_PIECES'.padStart(10), '  PACKAGE')
for (const [k, v] of ranked) {
    console.log(((v / MB).toFixed(1) + 'MB').padStart(9), String(piecesByPkg[k]).padStart(10), '  ' + k)
}
fs.writeFileSync('/tmp/offenders.json', JSON.stringify({ totalByPkg, piecesByPkg, okCount }, null, 2))
