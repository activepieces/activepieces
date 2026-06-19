import { statSync, existsSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join, resolve, isAbsolute } from 'node:path'
import * as esbuild from 'esbuild'

async function bundlePiece({ piecePath, distPath, repoRoot }: BundlePieceParams): Promise<BundleResult> {
    const entryFile = join(piecePath, 'src', 'index.ts')
    if (!existsSync(entryFile)) {
        throw new Error(`[bundlePiece] no entry at ${entryFile}`)
    }

    const manifest = readPieceManifest(piecePath)
    const { inlineAll, inlineList } = readInlineConfig(manifest)
    const inlined = new Set<string>()

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
        plugins: [externalizeThirdParty({ inlineAll, inlineList, inlined })],
        loader: { '.node': 'file' },
    })

    const issues = gateBundle({ metafile: result.metafile, warnings: result.warnings })
    if (issues.length > 0) {
        throw new Error(`[bundlePiece] ${piecePath} failed the safety gate:\n  - ${issues.join('\n  - ')}`)
    }

    const bundleBytes = statSync(outfile).size
    const rawBytes = totalInputBytes(result.metafile)
    const external = directDepsOf(manifest).filter((dep) => !inlined.has(dep) && !dep.startsWith('@activepieces/'))

    enforceSizeGate({ piecePath, bundleBytes })

    return { bundleFile: outfile, bundleBytes, rawBytes, external, inlined: [...inlined] }
}

function readPieceManifest(piecePath: string): PieceManifest {
    const pkgPath = join(piecePath, 'package.json')
    if (!existsSync(pkgPath)) {
        return {}
    }
    return JSON.parse(readFileSync(pkgPath, 'utf-8'))
}

function directDepsOf(manifest: PieceManifest): string[] {
    return Object.keys(manifest.dependencies ?? {})
}

// Per-piece inline opt-in:
//   bundleDeps === true      → inline every third-party dep
//   bundleDeps === ['a','b'] → inline only these
//   absent / false           → externalize all third-party (safe default)
function readInlineConfig(manifest: PieceManifest): { inlineAll: boolean, inlineList: Set<string> } {
    const value = manifest.bundleDeps
    if (value === true) {
        return { inlineAll: true, inlineList: new Set() }
    }
    if (Array.isArray(value)) {
        return { inlineAll: false, inlineList: new Set(value) }
    }
    return { inlineAll: false, inlineList: new Set() }
}

// External-by-default: only @activepieces/* workspace code (and relative/absolute
// imports) is bundled in. Node builtins and every other bare import are external
// unless the piece opted them in via bundleDeps.
function externalizeThirdParty({ inlineAll, inlineList, inlined }: ExternalizeParams): esbuild.Plugin {
    return {
        name: 'externalize-third-party',
        setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
                if (args.kind === 'entry-point') {
                    return null
                }
                const id = args.path
                if (id.startsWith('.') || isAbsolute(id)) {
                    return null
                }
                if (id.startsWith('@activepieces/')) {
                    return null
                }
                if (id.startsWith('node:') || NODE_BUILTINS.has(id)) {
                    return { path: id, external: true }
                }
                const top = topLevelPkg(id)
                if (inlineAll || inlineList.has(top)) {
                    inlined.add(top)
                    return null
                }
                return { path: id, external: true }
            })
        },
    }
}

// Build-time safety gate: a bundle that inlines a native addon, inlines a known-native
// package, or trips an esbuild warning will break at runtime — fail the build instead.
function gateBundle({ metafile, warnings }: GateParams): string[] {
    const issues: string[] = []
    const inputs = Object.keys(metafile.inputs)
    for (const input of inputs) {
        if (input.endsWith('.node')) {
            issues.push(`native addon inlined: ${input}`)
        }
    }
    // A known-native package can be inlined as JS while its .node binary loads via a
    // runtime-computed path (sqlite3/oracledb-shape) — no .node input, no warning, but
    // it WILL break once the bundle ships without that binary. Flag any such inline.
    const inlinedPkgs = new Set(inputs.map(pkgOfInput).filter((pkg): pkg is string => pkg !== null))
    for (const pkg of inlinedPkgs) {
        if (NATIVE_EXTERNALS.has(pkg)) {
            issues.push(`known-native package inlined: ${pkg} (declare it in bundleDeps only if you ship its binary)`)
        }
    }
    // Only warnings that mean "this will break once bundled" are blocking. Lint-style
    // warnings (duplicate object key, suspicious typeof, …) are surfaced but not fatal.
    for (const warning of warnings) {
        const where = warning.location ? ` (${warning.location.file}:${warning.location.line})` : ''
        if (HAZARD_WARNING_IDS.has(warning.id)) {
            issues.push(`${warning.text}${where}`)
        }
        else {
            console.warn(`[bundlePiece] non-fatal warning: ${warning.text}${where}`)
        }
    }
    return issues
}

// 'node_modules/@scope/n/x' → '@scope/n', 'node_modules/pkg/lib/x' → 'pkg'.
function pkgOfInput(input: string): string | null {
    const marker = 'node_modules/'
    const index = input.lastIndexOf(marker)
    if (index === -1) {
        return null
    }
    return topLevelPkg(input.slice(index + marker.length))
}

// '@scope/pkg/sub' → '@scope/pkg', 'pkg/sub/deep' → 'pkg'.
function topLevelPkg(id: string): string {
    if (id.startsWith('@')) {
        const [scope, name] = id.split('/')
        return name ? `${scope}/${name}` : scope
    }
    return id.split('/')[0]
}

function workspaceAliases(repoRoot: string): Record<string, string> {
    return {
        '@activepieces/shared': resolve(repoRoot, 'packages', 'shared', 'src'),
        '@activepieces/pieces-framework': resolve(repoRoot, 'packages', 'pieces', 'framework', 'src'),
        '@activepieces/pieces-common': resolve(repoRoot, 'packages', 'pieces', 'common', 'src'),
        '@activepieces/core-utils': resolve(repoRoot, 'packages', 'core', 'utils', 'src'),
        '@activepieces/core-piece-types': resolve(repoRoot, 'packages', 'core', 'piece-types', 'src'),
        '@activepieces/core-formula': resolve(repoRoot, 'packages', 'core', 'formula', 'src'),
        '@activepieces/core-execution': resolve(repoRoot, 'packages', 'core', 'execution', 'src'),
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
const NODE_BUILTINS = new Set(builtinModules)

// esbuild warning ids that mean the code will not work once bundled — a dynamic/indirect
// require or import esbuild cannot trace, or a missing/undefined import. These are fatal;
// every other warning id (code-quality lint) is non-fatal.
const HAZARD_WARNING_IDS = new Set<string>([
    'indirect-require',
    'unsupported-require-call',
    'unsupported-dynamic-import',
    'require-resolve-not-external',
    'import-is-undefined',
    'call-import-namespace',
    'commonjs-variable-in-esm',
])

// Known-native packages. With external-by-default these are external anyway; the list
// drives the gate: if a piece opts in to inline one, the build fails because esbuild
// cannot safely inline a .node addon (the binary loads at runtime, not from the bundle).
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
    repoRoot: string
}

export type BundleResult = {
    bundleFile: string
    bundleBytes: number
    rawBytes: number
    external: string[]
    inlined: string[]
}

type PieceManifest = {
    dependencies?: Record<string, string>
    bundleDeps?: boolean | string[]
}

type ExternalizeParams = {
    inlineAll: boolean
    inlineList: Set<string>
    inlined: Set<string>
}

type GateParams = {
    metafile: esbuild.Metafile
    warnings: esbuild.Message[]
}

type SizeGateParams = {
    piecePath: string
    bundleBytes: number
}
