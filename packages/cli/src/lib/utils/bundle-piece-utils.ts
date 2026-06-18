import { statSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import * as esbuild from 'esbuild'

async function bundlePiece({ piecePath, distPath }: BundlePieceParams): Promise<BundleResult> {
    const entryFile = join(piecePath, 'src', 'index.ts')
    if (!existsSync(entryFile)) {
        throw new Error(`[bundlePiece] no entry at ${entryFile}`)
    }

    const repoRoot = cwd()
    const directDeps = readDirectDeps(piecePath)
    const external = directDeps.filter((dep) => NATIVE_EXTERNALS.has(dep))

    const outfile = join(distPath, BUNDLE_FILENAME)
    const result = await esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outfile,
        minify: true,
        treeShaking: true,
        metafile: true,
        logLevel: 'silent',
        alias: workspaceAliases(repoRoot),
        external,
        loader: { '.node': 'file' },
    })

    const bundleBytes = statSync(outfile).size
    const rawBytes = totalInputBytes(result.metafile)

    enforceSizeGate({ piecePath, bundleBytes })

    return { bundleFile: outfile, bundleBytes, rawBytes, external }
}

function readDirectDeps(piecePath: string): string[] {
    const pkgPath = join(piecePath, 'package.json')
    if (!existsSync(pkgPath)) {
        return []
    }
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return Object.keys(pkg.dependencies ?? {})
}

function workspaceAliases(repoRoot: string): Record<string, string> {
    return {
        '@activepieces/shared': resolve(repoRoot, 'packages', 'shared', 'src'),
        '@activepieces/pieces-framework': resolve(repoRoot, 'packages', 'pieces', 'framework', 'src'),
        '@activepieces/pieces-common': resolve(repoRoot, 'packages', 'pieces', 'common', 'src'),
    }
}

function totalInputBytes(metafile: esbuild.Metafile): number {
    return Object.values(metafile.inputs).reduce((sum, input) => sum + input.bytes, 0)
}

function enforceSizeGate({ piecePath, bundleBytes }: SizeGateParams): void {
    const mb = bundleBytes / 1024 / 1024
    if (bundleBytes > FAIL_BYTES) {
        throw new Error(
            `[bundlePiece] ${piecePath} bundle is ${mb.toFixed(2)} MB, over the ${FAIL_BYTES / 1024 / 1024} MB cap`,
        )
    }
    if (bundleBytes > WARN_BYTES) {
        console.warn(`[bundlePiece] ${piecePath} bundle is ${mb.toFixed(2)} MB (warn threshold ${WARN_BYTES / 1024 / 1024} MB)`)
    }
}

const BUNDLE_FILENAME = 'index.bundle.js'
const WARN_BYTES = 3 * 1024 * 1024
const FAIL_BYTES = 5 * 1024 * 1024

// Native addons that cannot be inlined — externalized and shipped alongside the bundle.
const NATIVE_EXTERNALS = new Set<string>([
    'oracledb', 'duckdb', '@duckdb/node-api', '@duckdb/node-bindings',
    'better-sqlite3', 'sqlite3',
    'pg-native', 'mongodb-client-encryption', 'kerberos',
    'snappy', 'aws4', 'bson-ext', '@mongodb-js/zstd',
    'playwright', 'playwright-core', 'puppeteer', 'puppeteer-core',
])

export const bundlePieceUtils = { bundlePiece, BUNDLE_FILENAME }

export type BundlePieceParams = {
    piecePath: string
    distPath: string
}

export type BundleResult = {
    bundleFile: string
    bundleBytes: number
    rawBytes: number
    external: string[]
}

type SizeGateParams = {
    piecePath: string
    bundleBytes: number
}
