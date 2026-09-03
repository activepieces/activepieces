import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { chunk } from '@activepieces/core-utils'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { preparePieceDistForPublish } from '../../../packages/cli/src/lib/utils/prepare-piece-utils'
import { readPackageJson } from '../utils/files'

async function bundleIfNeeded(piecePath: string): Promise<void> {
    const bundleEntry = join(piecePath, 'dist', 'index.bundle.js')
    if (existsSync(bundleEntry)) {
        return
    }
    await preparePieceDistForPublish(piecePath)
}

function runNode(args: string[], cwd: string, timeoutMs: number): { status: number | null; stdout: string; stderr: string } {
    const r = spawnSync('node', args, { cwd, timeout: timeoutMs, encoding: 'utf-8' })
    return { status: r.status, stdout: r.stdout, stderr: r.stderr }
}

function installIntoScratch(spec: string, scratch: string, timeoutMs: number): { ok: boolean; error?: string } {
    writeFileSync(join(scratch, 'package.json'), JSON.stringify({ name: 'ap-heap-probe', version: '0.0.0', private: true }))
    const install = spawnSync('npm', [
        'install', spec,
        '--no-audit', '--no-fund', '--no-save',
        '--prefer-offline', '--production', '--force',
        '--loglevel=error',
    ], { cwd: scratch, timeout: timeoutMs, encoding: 'utf-8' })
    if (install.status !== 0) {
        return { ok: false, error: 'install-failed: ' + (install.stderr || install.stdout || '').slice(0, 240) }
    }
    return { ok: true }
}

function measureFromNodeModules(scratch: string, pkgName: string): { ok: boolean; heapMB?: number; error?: string } {
    const distFolder = join(scratch, 'node_modules', pkgName)
    if (!existsSync(distFolder)) {
        return { ok: false, error: `piece dir missing from scratch node_modules: ${distFolder}` }
    }
    const measure = runNode(['--expose-gc', resolve(__dirname, 'heap-check-child.mjs'), distFolder], scratch, 90_000)
    if (measure.status !== 0) {
        return { ok: false, error: 'child-crashed: ' + (measure.stderr || '').slice(0, 240) }
    }
    const line = measure.stdout.trim().split('\n').pop() ?? ''
    const parsed = JSON.parse(line) as { heapDeltaBytes?: number; error?: string }
    if (parsed.error) return { ok: false, error: parsed.error }
    return { ok: true, heapMB: parsed.heapDeltaBytes! / 1e6 }
}

function measurePreviousPublished(pkgName: string): { ok: boolean; heapMB?: number; version?: string; error?: string; missing?: boolean } {
    const view = spawnSync('npm', ['view', pkgName, 'version', '--json'], { timeout: 60_000, encoding: 'utf-8' })
    if (view.status !== 0) {
        const stderr = (view.stderr || '').toString()
        if (stderr.includes('E404')) {
            return { ok: true, missing: true }
        }
        return { ok: false, error: 'npm-view-failed: ' + stderr.slice(0, 240) }
    }
    const version = JSON.parse(view.stdout.trim()) as string

    const scratch = mkdtempSync(join(tmpdir(), 'ap-heap-prev-'))
    try {
        const install = installIntoScratch(`${pkgName}@${version}`, scratch, 5 * 60_000)
        if (!install.ok) return { ok: false, error: install.error, version }
        const m = measureFromNodeModules(scratch, pkgName)
        return { ...m, version }
    } finally {
        rmSync(scratch, { recursive: true, force: true })
    }
}

async function measureCurrent(piecePath: string, pkgName: string): Promise<{ ok: boolean; heapMB?: number; error?: string }> {
    await bundleIfNeeded(piecePath)
    const distPath = resolve(piecePath, 'dist')
    const scratch = mkdtempSync(join(tmpdir(), 'ap-heap-cur-'))
    try {
        const install = installIntoScratch(`file:${distPath}`, scratch, 5 * 60_000)
        if (!install.ok) return { ok: false, error: install.error }
        return measureFromNodeModules(scratch, pkgName)
    } finally {
        rmSync(scratch, { recursive: true, force: true })
    }
}

async function checkOne(piecePath: string): Promise<PieceHeapResult> {
    const pkg = await readPackageJson(piecePath)
    const [current, prev] = await Promise.all([
        measureCurrent(piecePath, pkg.name),
        Promise.resolve(measurePreviousPublished(pkg.name)),
    ])
    if (!current.ok) {
        return { name: pkg.name, ok: false, error: `current: ${current.error}` }
    }
    return {
        name: pkg.name,
        ok: true,
        heapMB: current.heapMB!,
        previousHeapMB: prev.ok && !prev.missing ? prev.heapMB : undefined,
        previousVersion: prev.version,
        previousMissing: prev.missing === true,
        previousError: !prev.ok ? prev.error : undefined,
    }
}

function verdict(r: PieceHeapResult): { failed: boolean; reasons: string[] } {
    const reasons: string[] = []
    if (!r.ok) {
        reasons.push(`could not measure current build: ${r.error ?? 'unknown error'}`)
        return { failed: true, reasons }
    }
    if (r.previousError !== undefined) {
        reasons.push(`could not measure previously-published version to verify delta: ${r.previousError}`)
        return { failed: true, reasons }
    }
    if (r.previousMissing === true) {
        if (r.heapMB! > ABSOLUTE_LIMIT_MB) {
            reasons.push(`heap ${r.heapMB!.toFixed(2)} MB > absolute limit ${ABSOLUTE_LIMIT_MB} MB (new piece)`)
        }
        return { failed: reasons.length > 0, reasons }
    }
    const delta = r.heapMB! - r.previousHeapMB!
    if (delta > DELTA_LIMIT_MB) {
        reasons.push(`heap grew +${delta.toFixed(2)} MB vs ${r.previousVersion} (${r.previousHeapMB!.toFixed(2)} → ${r.heapMB!.toFixed(2)} MB); allowed +${DELTA_LIMIT_MB} MB`)
    }
    return { failed: reasons.length > 0, reasons }
}

async function main(): Promise<void> {
    const changed = process.env['CHANGED_PIECES']
    const piecePaths = changed
        ? changed.split('\n').filter(Boolean)
        : await findAllPiecesDirectoryInSource()

    console.info(`[checkPiecesHeap] checking ${piecePaths.length} piece(s)${changed ? ' (scoped to changed)' : ' (all)'}  new pieces: heap <= ${ABSOLUTE_LIMIT_MB} MB  existing pieces: delta <= +${DELTA_LIMIT_MB} MB vs latest published`)

    const results: PieceHeapResult[] = []
    for (const batch of chunk(piecePaths, 3)) {
        results.push(...await Promise.all(batch.map(checkOne)))
    }

    let failed = 0
    for (const r of results) {
        const v = verdict(r)
        if (v.failed) failed++
        const tag = v.failed ? 'FAIL' : 'ok  '
        const heap = r.ok ? `${r.heapMB!.toFixed(2)} MB` : '—'
        const prev = r.previousHeapMB !== undefined
            ? `  (prev ${r.previousVersion}: ${r.previousHeapMB.toFixed(2)} MB)`
            : r.previousMissing
                ? '  (new piece, never published)'
                : ''
        console.info(`  [${tag}] ${r.name.padEnd(46)} ${heap.padStart(10)}${prev}`)
        for (const reason of v.reasons) {
            console.info(`         └─ ${reason}`)
        }
    }

    console.info('')
    console.info(`[checkPiecesHeap] checked=${results.length}  failed=${failed}`)

    if (failed > 0) {
        console.info(`\nTo bypass this check on a PR, apply the "${SKIP_LABEL}" label. Only use it when you understand the cost.`)
        process.exit(1)
    }
}

function parseLimitFromEnv(envKey: string, defaultMB: number): number {
    const raw = process.env[envKey]
    if (raw === undefined || raw === '') return defaultMB
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`invalid ${envKey}="${raw}": must be a positive number in MB`)
    }
    return parsed
}

const ABSOLUTE_LIMIT_MB = parseLimitFromEnv('PIECE_HEAP_ABSOLUTE_MB', 5)
const DELTA_LIMIT_MB = parseLimitFromEnv('PIECE_HEAP_DELTA_MB', 2)
const SKIP_LABEL = 'skip-heap-check'

type PieceHeapResult = {
    name: string
    ok: boolean
    heapMB?: number
    previousHeapMB?: number
    previousVersion?: string
    previousMissing?: boolean
    previousError?: string
    error?: string
}

main().catch(err => {
    console.error(err)
    process.exit(2)
})
