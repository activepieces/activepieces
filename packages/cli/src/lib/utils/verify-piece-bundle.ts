import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Packs the already-prepared dist/ (exactly what `npm publish` would upload), installs that
// tarball into a throwaway directory with NO ambient node_modules, and requires the package by
// name. This is what a real installer (self-hosted or otherwise) actually does — unlike
// requiring dist/ in-place inside the monorepo checkout, where hoisted workspace node_modules can
// mask a dependency the published manifest never declared (e.g. an inlined-but-not-copied wasm
// asset, or an externalized dep dropped from `dependencies`).
async function verifyPieceBundleLoads({ distPath }: VerifyPieceBundleParams): Promise<void> {
    const { name } = JSON.parse(readFileSync(join(distPath, 'package.json'), 'utf-8'))
    const verifyDir = mkdtempSync(join(tmpdir(), 'ap-verify-piece-'))
    try {
        writeFileSync(join(verifyDir, 'package.json'), JSON.stringify({ name: 'ap-piece-verify', version: '0.0.0', private: true }))
        const [{ filename }] = JSON.parse(
            execFileSync('npm', ['pack', '--json', '--pack-destination', verifyDir], { cwd: distPath }).toString(),
        )
        execFileSync('npm', ['install', '--no-save', '--no-audit', '--no-fund', join(verifyDir, filename)], { cwd: verifyDir, stdio: 'pipe' })
        execFileSync('node', ['-e', `require(${JSON.stringify(name)})`], { cwd: verifyDir, stdio: 'pipe' })
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        throw new Error(`[verifyPieceBundle] ${name} failed to install and load from a clean, isolated install:\n${detail}`)
    }
    finally {
        rmSync(verifyDir, { recursive: true, force: true })
    }
}

export const verifyPieceBundleUtils = { verifyPieceBundleLoads }

export type VerifyPieceBundleParams = {
    distPath: string
}
