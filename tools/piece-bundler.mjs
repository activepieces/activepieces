// Per-piece esbuild bundler + bundled-vs-raw measurement harness (SRE-166 / impact study).
//
// Bundled  = one tree-shaken, minified, self-contained file per piece (esbuild,
//            mirroring engine/esbuild.config.mjs: platform=node, format=cjs,
//            target=node20, treeShaking, alias workspace pkgs to /src,
//            externalize native addons only).
// Not bundled = what the raw model ships today: the full on-disk footprint of the
//            piece's node_modules dependency *closure* (every npm package bun would
//            install, transitively), measured by walking package.json deps.

import * as esbuild from 'esbuild'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '..')
const COMMUNITY = path.join(REPO, 'packages', 'pieces', 'community')
const ROOT_NM = path.join(REPO, 'node_modules')

// Workspace packages are bundled IN (aliased to /src), never treated as npm deps.
const WORKSPACE_ALIASES = {
    '@activepieces/shared': path.join(REPO, 'packages', 'shared', 'src'),
    '@activepieces/pieces-framework': path.join(REPO, 'packages', 'pieces', 'framework', 'src'),
    '@activepieces/pieces-common': path.join(REPO, 'packages', 'pieces', 'common', 'src'),
    '@activepieces/core-utils': path.join(REPO, 'packages', 'core', 'utils', 'src'),
    '@activepieces/core-piece-types': path.join(REPO, 'packages', 'core', 'piece-types', 'src'),
}

// Native addons / packages that must stay external (shipped alongside the bundle,
// not inlined). Curated from the project's native-tier list.
const NATIVE_EXTERNALS = new Set([
    'oracledb', 'duckdb', 'better-sqlite3', 'sqlite3',
    'pg-native', 'mongodb-client-encryption', 'kerberos',
    'snappy', 'aws4', 'bson-ext', '@mongodb-js/zstd',
    'playwright', 'playwright-core', 'puppeteer', 'puppeteer-core',
])

function dirSizeBytes(dir) {
    let total = 0
    let stack = [dir]
    while (stack.length) {
        const d = stack.pop()
        let entries
        try {
            entries = fs.readdirSync(d, { withFileTypes: true })
        } catch {
            continue
        }
        for (const e of entries) {
            const full = path.join(d, e.name)
            if (e.isSymbolicLink()) continue
            if (e.isDirectory()) {
                stack.push(full)
            } else if (e.isFile()) {
                try {
                    total += fs.statSync(full).size
                } catch {
                    // ignore
                }
            }
        }
    }
    return total
}

// Resolve a package's installed directory, honoring monorepo hoisting + nesting.
function resolvePkgDir(pkgName, fromDir) {
    let cur = fromDir
    while (true) {
        const candidate = path.join(cur, 'node_modules', pkgName)
        if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate
        const parent = path.dirname(cur)
        if (parent === cur) break
        cur = parent
    }
    const rootCandidate = path.join(ROOT_NM, pkgName)
    if (fs.existsSync(path.join(rootCandidate, 'package.json'))) return rootCandidate
    return null
}

// Full install closure: every npm package (transitively) the piece would carry.
function rawClosureBytes(pieceDir, directDeps) {
    const seen = new Map() // pkgName -> dir
    const queue = []
    for (const dep of directDeps) queue.push({ name: dep, from: pieceDir })

    while (queue.length) {
        const { name, from } = queue.pop()
        if (seen.has(name)) continue
        if (name.startsWith('@activepieces/')) continue // workspace → bundled in
        const dir = resolvePkgDir(name, from)
        if (!dir) {
            seen.set(name, null)
            continue
        }
        seen.set(name, dir)
        let pj
        try {
            pj = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
        } catch {
            continue
        }
        const next = { ...(pj.dependencies || {}), ...(pj.optionalDependencies || {}) }
        for (const child of Object.keys(next)) {
            if (!seen.has(child)) queue.push({ name: child, from: dir })
        }
    }

    let total = 0
    let resolved = 0
    let missing = 0
    for (const [, dir] of seen) {
        if (dir) {
            total += dirSizeBytes(dir)
            resolved++
        } else {
            missing++
        }
    }
    return { total, pkgCount: resolved, missing }
}

async function bundlePiece(pieceDir, directDeps) {
    const entry = path.join(pieceDir, 'src', 'index.ts')
    if (!fs.existsSync(entry)) return { ok: false, reason: 'no src/index.ts' }

    // Externalize only native addons that this piece actually depends on.
    const external = directDeps.filter((d) => NATIVE_EXTERNALS.has(d))

    const outfile = path.join('/tmp', 'ap-bundles', path.basename(pieceDir) + '.bundle.js')
    await fsp.mkdir(path.dirname(outfile), { recursive: true })

    try {
        const result = await esbuild.build({
            entryPoints: [entry],
            bundle: true,
            platform: 'node',
            target: 'node20',
            format: 'cjs',
            outfile,
            minify: true,
            treeShaking: true,
            metafile: true,
            logLevel: 'silent',
            alias: WORKSPACE_ALIASES,
            external,
            loader: { '.node': 'file' },
        })
        const size = fs.statSync(outfile).size
        // External native package footprint still ships alongside the bundle.
        let externalBytes = 0
        for (const ext of external) {
            const dir = resolvePkgDir(ext, pieceDir)
            if (dir) externalBytes += dirSizeBytes(dir)
        }
        return {
            ok: true,
            bundleBytes: size,
            externalBytes,
            external,
            warnings: result.warnings.length,
        }
    } catch (e) {
        return { ok: false, reason: (e.message || String(e)).split('\n')[0].slice(0, 200) }
    }
}

function fmt(bytes) {
    if (bytes == null) return '—'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(0) + ' KB'
    return (kb / 1024).toFixed(2) + ' MB'
}

async function measure(pieceName) {
    const pieceDir = path.join(COMMUNITY, pieceName)
    const pjPath = path.join(pieceDir, 'package.json')
    if (!fs.existsSync(pjPath)) return { pieceName, error: 'not found' }
    const pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'))
    const directDeps = Object.keys(pj.dependencies || {})

    const raw = rawClosureBytes(pieceDir, directDeps)
    const bundled = await bundlePiece(pieceDir, directDeps)

    return { pieceName, version: pj.version, directDeps: directDeps.length, raw, bundled }
}

const SAMPLE = process.argv.slice(2)
const pieces = SAMPLE.length
    ? SAMPLE
    : fs.readdirSync(COMMUNITY).filter((d) => fs.existsSync(path.join(COMMUNITY, d, 'package.json')))

const rows = []
for (const p of pieces) {
    const r = await measure(p)
    rows.push(r)
    if (r.error) {
        console.error(`SKIP ${p}: ${r.error}`)
        continue
    }
    const b = r.bundled
    if (!b.ok) {
        console.log(`${p.padEnd(28)} raw=${fmt(r.raw.total).padStart(9)}  bundle=FAILED (${b.reason})`)
    } else {
        const totalBundled = b.bundleBytes + b.externalBytes
        const ratio = r.raw.total > 0 ? (r.raw.total / totalBundled).toFixed(1) : '—'
        const extNote = b.external.length ? ` +ext[${b.external.join(',')}]=${fmt(b.externalBytes)}` : ''
        console.log(
            `${p.padEnd(28)} raw=${fmt(r.raw.total).padStart(9)} (${String(r.raw.pkgCount).padStart(3)} pkgs)  ` +
            `bundle=${fmt(b.bundleBytes).padStart(9)}${extNote}  ${ratio}x smaller`,
        )
    }
}

fs.writeFileSync('/tmp/ap-bundle-results.json', JSON.stringify(rows, null, 2))

// Aggregate for full-catalog runs.
const ok = rows.filter((r) => r.bundled?.ok)
if (ok.length > 1) {
    const rawTotal = ok.reduce((s, r) => s + r.raw.total, 0)
    const bundleTotal = ok.reduce((s, r) => s + r.bundled.bundleBytes + r.bundled.externalBytes, 0)
    const failed = rows.filter((r) => r.bundled && !r.bundled.ok)
    console.log('\n' + '='.repeat(70))
    console.log(`Pieces bundled OK: ${ok.length}/${rows.length}  (failed: ${failed.length})`)
    console.log(`Raw catalog footprint:    ${fmt(rawTotal)}`)
    console.log(`Bundled catalog footprint:${fmt(bundleTotal)}`)
    console.log(`Reduction: ${(100 * (1 - bundleTotal / rawTotal)).toFixed(1)}%  (${(rawTotal / bundleTotal).toFixed(1)}x smaller)`)
    if (failed.length) console.log(`Failed: ${failed.map((r) => r.pieceName).join(', ')}`)
}
