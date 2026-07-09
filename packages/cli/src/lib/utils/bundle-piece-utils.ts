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
    const { inlineAll, inlineList, excludeList } = readInlineConfig(manifest)
    const outfile = join(distPath, BUNDLE_FILENAME)

    // Pass 1: inline everything safe. Known-native packages are externalized upfront so a
    // native .node binary can never be pulled into the bundle.
    let pass = await runEsbuild({ entryFile, outfile, repoRoot, inlineAll, inlineList, external: new Set(excludeList) })

    // A dynamic/indirect require (or a stray .node) can only be detected after esbuild has tried
    // to trace it. If pass 1 surfaced any such unsafe package, externalize it and rebuild ONCE —
    // auto-externalize the offending dep instead of failing the whole piece. Only the handful of
    // pieces with dynamic-require deps (couchbase, metabase, text-helper, scrapeless) hit pass 2.
    const unsafe = unsafePackages({ metafile: pass.result.metafile, warnings: pass.result.warnings })
    if (unsafe.size > 0) {
        pass = await runEsbuild({ entryFile, outfile, repoRoot, inlineAll, inlineList, external: new Set([...excludeList, ...unsafe]) })
    }

    // Anything still broken after auto-externalization is a genuine un-resolvable bug — fail loud.
    let issues = gateBundle({ metafile: pass.result.metafile, warnings: pass.result.warnings })
    if (issues.length > 0) {
        throw new Error(`[bundlePiece] ${piecePath} failed the safety gate:\n  - ${issues.join('\n  - ')}`)
    }

    // Size fallback: inlining a very large SDK (e.g. datadog's 7.7 MB API client) blows the cap.
    // Rather than fail, fall back to external-by-default for this piece — its third-party deps
    // install at runtime and the bundle stays small. Keeps every piece building and lean.
    if (inlineAll && statSync(outfile).size > FAIL_BYTES) {
        pass = await runEsbuild({ entryFile, outfile, repoRoot, inlineAll: false, inlineList: new Set(), external: new Set(excludeList) })
        issues = gateBundle({ metafile: pass.result.metafile, warnings: pass.result.warnings })
        if (issues.length > 0) {
            throw new Error(`[bundlePiece] ${piecePath} failed the safety gate (external fallback):\n  - ${issues.join('\n  - ')}`)
        }
    }

    const bundleBytes = statSync(outfile).size
    const rawBytes = totalInputBytes(pass.result.metafile)
    const external = directDepsOf(manifest).filter((dep) => !pass.inlined.has(dep) && !dep.startsWith('@activepieces/') && !BUNDLE_HELPER_DEPS.has(dep))

    enforceSizeGate({ piecePath, bundleBytes })

    return { bundleFile: outfile, bundleBytes, rawBytes, external, inlined: [...pass.inlined] }
}

async function runEsbuild({ entryFile, outfile, repoRoot, inlineAll, inlineList, external }: RunEsbuildParams): Promise<EsbuildPass> {
    const inlined = new Set<string>()
    const result = await esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outfile,
        minify: true,
        // The engine extracts a piece by scanning module exports for one whose
        // `constructor.name === 'Piece'` (see extractPieceFromModule). Minification would
        // otherwise mangle the Piece class name and make every bundled piece un-installable.
        keepNames: true,
        treeShaking: true,
        metafile: true,
        logLevel: 'silent',
        alias: workspaceAliases(repoRoot),
        plugins: [externalizeThirdParty({ inlineAll, inlineList, external, inlined })],
        loader: { '.node': 'file' },
    })
    return { result, inlined }
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

// Inline-by-default. Third-party deps are bundled in unless they cannot be safely inlined
// (native addons / dynamic require — those are auto-externalized by the safety gate):
//   bundleDeps absent / true → inline every third-party dep (default)
//   bundleDeps === ['a','b']  → inline only these
//   bundleDeps === false      → externalize all third-party (explicit opt-out / escape hatch)
// `excludeList` (known-native packages) is always kept external, even under inline-all.
function readInlineConfig(manifest: PieceManifest): InlineConfig {
    const value = manifest.bundleDeps
    const excludeList = new Set(NATIVE_EXTERNALS)
    if (value === false) {
        return { inlineAll: false, inlineList: new Set(), excludeList }
    }
    if (Array.isArray(value)) {
        return { inlineAll: false, inlineList: new Set(value), excludeList }
    }
    return { inlineAll: true, inlineList: new Set(), excludeList }
}

// Only @activepieces/* workspace code and relative/absolute imports are always bundled in.
// Node builtins and packages in `external` (known-native + auto-externalized dynamic-require
// deps) are kept external. Everything else is inlined when inlineAll / listed in inlineList.
function externalizeThirdParty({ inlineAll, inlineList, external, inlined }: ExternalizeParams): esbuild.Plugin {
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
                if (external.has(top)) {
                    return { path: id, external: true }
                }
                if (inlineAll || inlineList.has(top)) {
                    inlined.add(top)
                    return null
                }
                return { path: id, external: true }
            })
        },
    }
}

// The packages that cannot be safely inlined and must be externalized: a `.node` native addon
// that slipped in, or a dynamic/indirect require esbuild could not trace (HAZARD_WARNING_IDS).
// Maps each back to its top-level package so the caller can rebuild with them externalized.
function unsafePackages({ metafile, warnings }: GateParams): Set<string> {
    const pkgs = new Set<string>()
    for (const input of Object.keys(metafile.inputs)) {
        if (input.endsWith('.node')) {
            const pkg = pkgOfInput(input)
            if (pkg !== null) {
                pkgs.add(pkg)
            }
        }
    }
    for (const warning of warnings) {
        if (!HAZARD_WARNING_IDS.has(warning.id)) {
            continue
        }
        const file = warning.location?.file
        const pkg = file ? pkgOfInput(file) : null
        if (pkg !== null) {
            pkgs.add(pkg)
        }
    }
    return pkgs
}

// Build-time safety gate, evaluated on the FINAL pass. By now native/dynamic-require deps have
// been auto-externalized, so any inlined native addon, inlined known-native package, or surviving
// runtime-hazard warning means a genuinely un-resolvable bundle — fail the build instead.
function gateBundle({ metafile, warnings }: GateParams): string[] {
    const issues: string[] = []
    const inputs = Object.keys(metafile.inputs)
    for (const input of inputs) {
        if (input.endsWith('.node')) {
            issues.push(`native addon inlined: ${input}`)
        }
    }
    const inlinedPkgs = new Set(inputs.map(pkgOfInput).filter((pkg): pkg is string => pkg !== null))
    for (const pkg of inlinedPkgs) {
        if (NATIVE_EXTERNALS.has(pkg)) {
            issues.push(`known-native package inlined: ${pkg}`)
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
        // form-data → mime-types → mime-db pulls ~133 KB of MIME data into every HTTP piece
        // bundle. Swap in a minimal common-types table; uncommon types fall back gracefully.
        'mime-db': resolve(repoRoot, 'packages', 'pieces', 'framework', 'src', 'mime-db-min.cjs'),
        '@activepieces/shared': resolve(repoRoot, 'packages', 'core', 'shared', 'src'),
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

// The published bundle lives at src/index.js — the entry path the engine's piece loader
// resolves (older deployed engines hardcode `<package>/src/index.js`, ignoring package.json
// "main"). Emitting a single self-contained src/index.js keeps bundled pieces installable
// on every engine version while still inlining all @activepieces/* workspace code.
const BUNDLE_FILENAME = 'src/index.js'
// tslib only exists to back tsc's `importHelpers` down-levelling. esbuild emits its own inline
// helpers, so the published bundle never requires it. Drop it from every manifest rather than
// telling the runtime installer to fetch a package the bundle does not use. (Deps loaded
// out-of-band — e.g. a forked child requiring oracledb — are NOT declared-dead and stay.)
const BUNDLE_HELPER_DEPS = new Set<string>(['tslib'])
const WARN_BYTES = 3 * 1024 * 1024
const FAIL_BYTES = 5 * 1024 * 1024
const NODE_BUILTINS = new Set(builtinModules)

// esbuild warning ids that mean the code will not work once bundled — a dynamic/indirect
// require or import esbuild cannot trace, or a missing/undefined import. The bundler reacts to
// these by auto-externalizing the offending package; if one survives that, the gate fails.
const HAZARD_WARNING_IDS = new Set<string>([
    'indirect-require',
    'unsupported-require-call',
    'unsupported-dynamic-import',
    'require-resolve-not-external',
    'import-is-undefined',
    'call-import-namespace',
    'commonjs-variable-in-esm',
])

// Known-native packages: they ship a `.node` binary (or load one via a runtime-computed path)
// and cannot be inlined. Always kept external, even under inline-by-default.
const NATIVE_EXTERNALS = new Set<string>([
    'oracledb', 'duckdb', '@duckdb/node-api', '@duckdb/node-bindings',
    'better-sqlite3', 'sqlite3', 'cpu-features',
    'pg-native', 'mongodb-client-encryption', 'kerberos',
    'snappy', 'aws4', 'bson-ext', '@mongodb-js/zstd',
    'playwright', 'playwright-core', 'puppeteer', 'puppeteer-core',
    'sharp',
    // native-backed SDK (pulls better-sqlite3), and packages that load sibling files at runtime:
    // pg-format → require(__dirname + '/reserved.js'); clarifai-nodejs-grpc → loadSync('*.proto').
    '@actual-app/api', 'pg-format', 'clarifai-nodejs-grpc',
])

export const bundlePieceUtils = { bundlePiece, BUNDLE_FILENAME, readInlineConfig, unsafePackages }

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

type InlineConfig = {
    inlineAll: boolean
    inlineList: Set<string>
    excludeList: Set<string>
}

type EsbuildPass = {
    result: esbuild.BuildResult & { metafile: esbuild.Metafile }
    inlined: Set<string>
}

type RunEsbuildParams = {
    entryFile: string
    outfile: string
    repoRoot: string
    inlineAll: boolean
    inlineList: Set<string>
    external: Set<string>
}

type PieceManifest = {
    dependencies?: Record<string, string>
    bundleDeps?: boolean | string[]
}

type ExternalizeParams = {
    inlineAll: boolean
    inlineList: Set<string>
    external: Set<string>
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
