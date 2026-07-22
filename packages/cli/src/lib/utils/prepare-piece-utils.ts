import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, statSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { buildWorkspaceVersionMap, findRepoRoot, resolveWorkspaceDependencies, stripSemverRanges } from './workspace-utils'
import { bundlePieceUtils } from './bundle-piece-utils'

function copyPackageJson({ piecePath, distPath }: PieceDistPaths): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        throw new Error(`[preparePiece] no package.json at ${srcPackageJson}`)
    }
    copyFileSync(srcPackageJson, join(distPath, 'package.json'))
}

function copyI18nAssets({ piecePath, distPath }: PieceDistPaths): void {
    const i18nSrc = join(piecePath, 'src', 'i18n')
    if (!existsSync(i18nSrc)) {
        return
    }

    const i18nDest = join(distPath, 'src', 'i18n')
    mkdirSync(i18nDest, { recursive: true })

    const files = readdirSync(i18nSrc)
    for (const file of files) {
        copyFileSync(join(i18nSrc, file), join(i18nDest, file))
    }
}

async function preparePieceDistForPublish(piecePath: string): Promise<void> {
    const distPath = join(piecePath, 'dist')

    if (!existsSync(distPath)) {
        throw new Error(`[preparePiece] no dist output at ${distPath} for ${piecePath}`)
    }

    const repoRoot = findRepoRoot(piecePath)
    const paths = { piecePath, distPath }
    copyPackageJson(paths)
    copyI18nAssets(paths)

    const { bundleBytes, rawBytes, external } = await bundlePieceUtils.bundlePiece({ ...paths, repoRoot })

    rewriteManifestForBundle({ distPath, external, repoRoot })
    pruneDistToPublishedFiles({ distPath })

    const ratio = rawBytes > 0 ? (rawBytes / bundleBytes).toFixed(1) : '—'
    const extNote = external.length ? ` external=[${external.join(', ')}]` : ''
    console.info(`[preparePiece] bundled ${piecePath} → ${(bundleBytes / 1024).toFixed(0)} KB (${ratio}x smaller than ${(rawBytes / 1024).toFixed(0)} KB raw inputs)${extNote}`)
}

// The published artifact inlines @activepieces/* workspace code AND third-party deps into the
// self-contained bundle by default. Only deps that cannot be safely inlined (native addons,
// dynamic require) stay external and are kept here so the runtime installer resolves them.
// A piece can force a dep external via bundleDeps in its package.json (escape hatch).
function rewriteManifestForBundle({ distPath, external, repoRoot }: { distPath: string, external: string[], repoRoot: string }): void {
    const distPackageJsonPath = join(distPath, 'package.json')
    const json = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'))

    const workspaceVersionMap = buildWorkspaceVersionMap(repoRoot)
    const resolvedDeps = stripSemverRanges(resolveWorkspaceDependencies(json.dependencies ?? {}, workspaceVersionMap)) ?? {}

    const externalDeps: Record<string, string> = {}
    for (const dep of external) {
        const version = resolvedDeps[dep] ?? resolveInstalledVersion({ dep, repoRoot })
        if (version === undefined) {
            throw new Error(`[preparePiece] external dependency "${dep}" has no resolvable version (not a direct dependency and not found under node_modules); publishing it would crash at runtime with a missing module`)
        }
        externalDeps[dep] = version
    }

    json.main = `./${bundlePieceUtils.BUNDLE_FILENAME}`
    json.dependencies = externalDeps
    delete json.devDependencies
    delete json.peerDependencies
    delete json.scripts
    delete json.types
    delete json.bundleDeps
    json.files = [bundlePieceUtils.BUNDLE_FILENAME, 'package.json', 'src/i18n']

    writeFileSync(distPackageJsonPath, JSON.stringify(json, null, 2) + '\n')
}

function resolveInstalledVersion({ dep, repoRoot }: { dep: string, repoRoot: string }): string | undefined {
    try {
        const requireFromRoot = createRequire(join(repoRoot, 'package.json'))
        return JSON.parse(readFileSync(requireFromRoot.resolve(`${dep}/package.json`), 'utf-8')).version
    }
    catch {
        return findInstalledVersion({ nodeModulesDir: join(repoRoot, 'node_modules'), dep })
    }
}

function findInstalledVersion({ nodeModulesDir, dep }: { nodeModulesDir: string, dep: string }): string | undefined {
    const relPackageJson = join(...dep.split('/'), 'package.json')
    const stack = [nodeModulesDir]
    while (stack.length > 0) {
        const dir = stack.pop()!
        const candidate = join(dir, relPackageJson)
        if (existsSync(candidate)) {
            return JSON.parse(readFileSync(candidate, 'utf-8')).version
        }
        stack.push(...nestedNodeModules(dir))
    }
    return undefined
}

function nestedNodeModules(nodeModulesDir: string): string[] {
    return safeReaddir(nodeModulesDir).flatMap((name) => {
        const packageDir = join(nodeModulesDir, name)
        const packageDirs = name.startsWith('@')
            ? safeReaddir(packageDir).map((child) => join(packageDir, child))
            : [packageDir]
        return packageDirs.map((d) => join(d, 'node_modules')).filter((nested) => existsSync(nested))
    })
}

function safeReaddir(dir: string): string[] {
    try {
        return readdirSync(dir)
    }
    catch {
        return []
    }
}

// After bundling, dist/ still holds the full tsc output (compiled lib/*, .d.ts, .map). Prune it
// down to EXACTLY what npm would publish — the manifest's `files` allow-list (the self-contained
// bundle + i18n) plus package.json — so `dist/` mirrors the published artifact 1:1.
function pruneDistToPublishedFiles({ distPath }: { distPath: string }): void {
    const json = JSON.parse(readFileSync(join(distPath, 'package.json'), 'utf-8'))
    const entries: string[] = json.files ?? []

    const keepFiles = new Set<string>(['package.json'])
    const keepDirs: string[] = []
    for (const entry of entries) {
        const normalized = entry.replace(/\/$/, '')
        const abs = join(distPath, normalized)
        if (existsSync(abs) && statSync(abs).isDirectory()) {
            keepDirs.push(normalized)
        }
        else {
            keepFiles.add(normalized)
        }
    }

    const toPosix = (p: string): string => p.split('\\').join('/')
    const isKept = (rel: string): boolean =>
        keepFiles.has(rel) || keepDirs.some((dir) => rel === dir || rel.startsWith(`${dir}/`))

    const removeUnpublished = (dir: string): boolean => {
        let empty = true
        for (const name of readdirSync(dir)) {
            const full = join(dir, name)
            if (statSync(full).isDirectory()) {
                const childEmpty = removeUnpublished(full)
                if (childEmpty) {
                    rmSync(full, { recursive: true, force: true })
                }
                else {
                    empty = false
                }
            }
            else if (isKept(toPosix(relative(distPath, full)))) {
                empty = false
            }
            else {
                rmSync(full, { force: true })
            }
        }
        return empty
    }

    removeUnpublished(distPath)
}

export { preparePieceDistForPublish, resolveInstalledVersion, findInstalledVersion }

type PieceDistPaths = {
    piecePath: string
    distPath: string
}
