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

const THRESHOLD = (Number(process.argv[2]) || 300) * 1024

function groupKey(file) {
    let m = file.match(/\.bun\/((@[^/]+\/)?[^@/]+)@/)
    if (m) return m[1]
    m = file.match(/packages\/(shared)\//)
    if (m) return '@activepieces/shared'
    return null
}

async function topContribForPiece(pieceName) {
    const pieceDir = path.join(COMMUNITY, pieceName)
    const entry = path.join(pieceDir, 'src', 'index.ts')
    if (!fs.existsSync(entry)) return null
    const pj = JSON.parse(fs.readFileSync(path.join(pieceDir, 'package.json'), 'utf8'))
    const directDeps = Object.keys(pj.dependencies || {})
    const external = directDeps.filter((d) => NATIVE_EXTERNALS.has(d))
    let result
    try {
        result = await esbuild.build({
            entryPoints: [entry], bundle: true, platform: 'node', target: 'node20', format: 'cjs',
            write: false, outdir: '/tmp/ap-tail-out', minify: true, treeShaking: true, metafile: true, logLevel: 'silent',
            alias: WORKSPACE_ALIASES, external, loader: { '.node': 'file' },
        })
    } catch {
        return { pieceName, total: 0, failed: true }
    }
    const out = Object.values(result.metafile.outputs)[0]
    const total = out.bytes
    const grp = {}
    let sharedBytes = 0
    let fullZod = false
    for (const [file, v] of Object.entries(out.inputs)) {
        const k = groupKey(file) || 'piece-src'
        grp[k] = (grp[k] || 0) + v.bytesInOutput
        if (k === '@activepieces/shared') sharedBytes += v.bytesInOutput
        if (/\.bun\/zod@/.test(file) && !/\/mini\//.test(file)) fullZod = true
    }
    const top = Object.entries(grp).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { pieceName, total, top, sharedBytes, fullZod }
}

const pieces = fs.readdirSync(COMMUNITY).filter((d) => fs.existsSync(path.join(COMMUNITY, d, 'package.json')))
const rows = []
for (const p of pieces) {
    const r = await topContribForPiece(p)
    if (r && r.total >= THRESHOLD) rows.push(r)
}
rows.sort((a, b) => b.total - a.total)
const fmt = (b) => (b / 1024).toFixed(0) + 'KB'
console.log(`\n${rows.length} pieces >= ${THRESHOLD / 1024}KB\n`)
for (const r of rows) {
    const topStr = r.top.map(([k, v]) => `${k} ${fmt(v)}`).join(', ')
    const flags = (r.fullZod ? ' [FULL-ZOD]' : '') + (r.sharedBytes > 0 ? ` [shared ${fmt(r.sharedBytes)}]` : '')
    console.log(fmt(r.total).padStart(8), r.pieceName.padEnd(26), '| ', topStr + flags)
}
fs.writeFileSync('/tmp/tail-analysis.json', JSON.stringify(rows, null, 2))
