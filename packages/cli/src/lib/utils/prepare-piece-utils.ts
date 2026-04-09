import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser'
import type { ParseError } from 'jsonc-parser'
import { buildWorkspaceVersionMap, resolveWorkspaceDependencies, stripSemverRanges } from './workspace-utils'

/**
 * Parses bun.lock and builds a map of every resolved (non-workspace) package.
 * Workspace entries (e.g. "name@workspace:path") are skipped.
 */
function parseBunLock(): ParsedBunLock {
    const lockPath = join(cwd(), 'bun.lock')
    const raw = readFileSync(lockPath, 'utf-8')
    const errors: ParseError[] = []
    const lock = parseJsonc(raw, errors, { allowTrailingComma: true })
    if (errors.length > 0) {
        const details = errors.map((e) => `${printParseErrorCode(e.error)} at offset ${e.offset}`).join(', ')
        throw new Error(`[parseBunLock] failed to parse ${lockPath}: ${details}`)
    }
    const packages: Record<string, BunLockPackageTuple> = lock.packages

    const resolvedPackages = new Map<string, ResolvedPackage>()

    for (const [packagePath, [nameAtVersion, _registry, metadata]] of Object.entries(packages)) {
        if (!nameAtVersion || nameAtVersion.includes('workspace:')) {
            continue
        }

        const atIndex = nameAtVersion.lastIndexOf('@')
        if (atIndex <= 0) {
            continue
        }

        const pkgName = nameAtVersion.slice(0, atIndex)
        const version = nameAtVersion.slice(atIndex + 1)

        resolvedPackages.set(packagePath, {
            pkgName,
            version,
            dependencies: metadata?.dependencies ?? {},
        })
    }

    return { resolvedPackages }
}

/**
 * Looks up a dependency in the resolved packages map.
 * Bun nests duplicates under their parent's path (e.g. "axios/follow-redirects"),
 * so we first check `parentPackagePath/depName`, then fall back to the top-level `depName`.
 */
function lookupResolvedPackage({ depName, parentPackagePath, resolvedPackages }: { depName: string, parentPackagePath: string, resolvedPackages: Map<string, ResolvedPackage> }): { packagePath: string, pkg: ResolvedPackage } | null {
    if (parentPackagePath) {
        const nestedKey = `${parentPackagePath}/${depName}`
        const pkg = resolvedPackages.get(nestedKey)
        if (pkg) {
            return { packagePath: nestedKey, pkg }
        }
    }

    const pkg = resolvedPackages.get(depName)
    if (pkg) {
        return { packagePath: depName, pkg }
    }

    return null
}

/**
 * BFS-walks the dependency tree starting from `directDeps`, collecting every
 * transitive dependency with its exact pinned version from the lockfile.
 */
function flattenTransitiveDeps(
    directDeps: Record<string, string>,
    parsedLock: ParsedBunLock,
): Record<string, string> {
    const { resolvedPackages } = parsedLock
    const result: Record<string, string> = {}
    const visited = new Set<string>()
    const queue: { name: string, parentPackagePath: string }[] = []

    for (const depName of Object.keys(directDeps)) {
        if (depName.startsWith('@activepieces/')) {
            continue
        }
        queue.push({ name: depName, parentPackagePath: '' })
    }

    while (queue.length > 0) {
        const { name, parentPackagePath } = queue.shift()!

        const resolved = lookupResolvedPackage({ depName: name, parentPackagePath, resolvedPackages })
        if (!resolved) {
            throw new Error(`[flattenTransitiveDeps] dependency "${name}" not found in bun.lock — lockfile may be stale, run "bun install"`)
        }

        const { packagePath, pkg } = resolved
        if (visited.has(packagePath)) {
            continue
        }
        visited.add(packagePath)

        if (pkg.pkgName in result) {
            if (result[pkg.pkgName] !== pkg.version) {
                console.warn(`[flattenTransitiveDeps] version conflict for "${pkg.pkgName}": pinning ${result[pkg.pkgName]}, skipping ${pkg.version}`)
            }
        } else {
            result[pkg.pkgName] = pkg.version
        }

        for (const subDepName of Object.keys(pkg.dependencies)) {
            if (subDepName.startsWith('@activepieces/')) {
                continue
            }
            queue.push({ name: subDepName, parentPackagePath: packagePath })
        }
    }

    return result
}

function pinDependenciesFromLockfile(
    deps: Record<string, string>,
    parsedLock: ParsedBunLock,
): Record<string, string> {
    const transitiveDeps = flattenTransitiveDeps(deps, parsedLock)
    const merged: Record<string, string> = { ...transitiveDeps }
    for (const [name, version] of Object.entries(deps)) {
        if (name.startsWith('@activepieces/')) {
            merged[name] = version
        } else {
            merged[name] = transitiveDeps[name] ?? version
        }
    }
    return merged
}

function copyPackageJson({ piecePath, distPath }: PieceDistPaths): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        return
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

function symlinkNodeModules({ piecePath, distPath }: PieceDistPaths): void {
    const srcNodeModules = resolve(piecePath, 'node_modules')
    const distNodeModules = join(distPath, 'node_modules')
    if (!existsSync(srcNodeModules) || existsSync(distNodeModules)) {
        return
    }
    symlinkSync(resolve(srcNodeModules), distNodeModules, 'dir')
}

function preparePieceDistForPublish(piecePath: string, parsedLock?: ParsedBunLock): void {
    const distPath = join(piecePath, 'dist')

    if (!existsSync(distPath)) {
        throw new Error(`[preparePiece] no dist output at ${distPath} for ${piecePath}`)
    }

    const paths = { piecePath, distPath }
    copyPackageJson(paths)
    copyI18nAssets(paths)
    symlinkNodeModules(paths)

    const resolvedLockData = parsedLock ?? parseBunLock()
    const workspaceVersionMap = buildWorkspaceVersionMap(cwd())

    const distPackageJsonPath = join(distPath, 'package.json')
    const json = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'))

    json.dependencies = stripSemverRanges(resolveWorkspaceDependencies(json.dependencies, workspaceVersionMap))
    json.devDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.devDependencies, workspaceVersionMap))
    json.peerDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.peerDependencies, workspaceVersionMap))

    // Only pin transitive deps for `dependencies` — devDependencies aren't installed by consumers,
    // and peerDependencies should not be pinned (they're provided by the consumer's project).
    if (json.dependencies) {
        json.dependencies = pinDependenciesFromLockfile(json.dependencies, resolvedLockData)
    }

    writeFileSync(distPackageJsonPath, JSON.stringify(json, null, 2) + '\n')
    console.info(`[preparePiece] prepared ${piecePath} (${Object.keys(json.dependencies ?? {}).length} deps)`)
}

export { parseBunLock, flattenTransitiveDeps, pinDependenciesFromLockfile, preparePieceDistForPublish }

/**
 * Shape of each entry in bun.lock's `packages` record:
 *   [0] = resolved identifier, e.g. "axios@1.13.5"
 *   [1] = registry (empty string = default npm)
 *   [2] = metadata object containing `dependencies`
 *   [3] = integrity hash
 */
type BunLockPackageTuple = [
    nameAtVersion: string,
    registry: string,
    metadata?: { dependencies?: Record<string, string> },
    integrity?: string,
]

type ResolvedPackage = {
    pkgName: string
    version: string
    dependencies: Record<string, string>
}

type ParsedBunLock = {
    resolvedPackages: Map<string, ResolvedPackage>
}

type PieceDistPaths = {
    piecePath: string
    distPath: string
}
