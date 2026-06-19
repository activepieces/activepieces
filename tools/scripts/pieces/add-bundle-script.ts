import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

// One-time backfill: give every piece package a per-package `bundle` script so the
// turbo `bundle` task can build each piece's index.bundle.js in isolation. New pieces
// get this from the create-piece generator; this script covers the existing catalog.
const BUNDLE_SCRIPT = 'node ../../../../dist/packages/cli/src/index.js pieces bundle'
const PIECE_ROOTS = ['community', 'core', 'custom']

function pieceDirs(repoRoot: string): string[] {
    const dirs: string[] = []
    for (const root of PIECE_ROOTS) {
        const base = join(repoRoot, 'packages', 'pieces', root)
        if (!existsSync(base)) {
            continue
        }
        for (const entry of readdirSync(base, { withFileTypes: true })) {
            if (entry.isDirectory() && existsSync(join(base, entry.name, 'package.json'))) {
                dirs.push(join(base, entry.name))
            }
        }
    }
    return dirs
}

function addBundleScript(pieceDir: string): boolean {
    const pkgPath = join(pieceDir, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    pkg.scripts = pkg.scripts ?? {}
    if (pkg.scripts.bundle === BUNDLE_SCRIPT) {
        return false
    }
    const ordered: Record<string, string> = {}
    if (pkg.scripts.build) {
        ordered.build = pkg.scripts.build
    }
    ordered.bundle = BUNDLE_SCRIPT
    for (const [key, value] of Object.entries<string>(pkg.scripts)) {
        if (key !== 'build' && key !== 'bundle') {
            ordered[key] = value
        }
    }
    pkg.scripts = ordered
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    return true
}

const repoRoot = cwd()
let changed = 0
for (const dir of pieceDirs(repoRoot)) {
    if (addBundleScript(dir)) {
        changed++
    }
}
console.info(`[add-bundle-script] added bundle script to ${changed} piece package(s)`)
