import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { buildWorkspaceVersionMap, resolveWorkspaceDependencies, stripSemverRanges } from './workspace-utils'

function parseBunLock(rootDir: string): BunLockData {
    const lockPath = join(rootDir, 'bun.lock')
    const raw = readFileSync(lockPath, 'utf-8').replace(/,(\s*[}\]])/g, '$1')
    const lock = JSON.parse(raw)
    const packages: Record<string, [string, ...unknown[]]> = lock.packages

    const resolvedVersions = new Map<string, string>()
    const entries = new Map<string, BunLockEntry>()

    for (const [key, entry] of Object.entries(packages)) {
        const resolved = entry[0] as string
        if (!resolved || resolved.includes('workspace:')) {
            continue
        }

        const atIndex = resolved.lastIndexOf('@')
        if (atIndex <= 0) {
            continue
        }

        const pkgName = resolved.slice(0, atIndex)
        const version = resolved.slice(atIndex + 1)

        if (!resolvedVersions.has(pkgName)) {
            resolvedVersions.set(pkgName, version)
        }

        const meta = entry[2] as { dependencies?: Record<string, string> } | undefined
        entries.set(key, {
            pkgName,
            version,
            dependencies: meta?.dependencies ?? {},
        })
    }

    return { resolvedVersions, entries }
}

function resolveEntry(depName: string, scope: string, entries: Map<string, BunLockEntry>): { key: string, entry: BunLockEntry } | null {
    if (scope) {
        const scopedKey = `${scope}/${depName}`
        const entry = entries.get(scopedKey)
        if (entry) {
            return { key: scopedKey, entry }
        }
    }

    const entry = entries.get(depName)
    if (entry) {
        return { key: depName, entry }
    }

    return null
}

function flattenTransitiveDeps(
    directDeps: Record<string, string>,
    lockData: BunLockData,
): Record<string, string> {
    const { entries } = lockData
    const result: Record<string, string> = {}
    const visited = new Set<string>()
    const queue: { name: string, scope: string }[] = []

    for (const depName of Object.keys(directDeps)) {
        if (depName.startsWith('@activepieces/')) {
            continue
        }
        queue.push({ name: depName, scope: '' })
    }

    while (queue.length > 0) {
        const { name, scope } = queue.shift()!

        const resolved = resolveEntry(name, scope, entries)
        if (!resolved) {
            continue
        }

        const { key, entry } = resolved
        if (visited.has(key)) {
            continue
        }
        visited.add(key)

        if (!(entry.pkgName in result)) {
            result[entry.pkgName] = entry.version
        }

        for (const subDepName of Object.keys(entry.dependencies)) {
            if (subDepName.startsWith('@activepieces/')) {
                continue
            }
            queue.push({ name: subDepName, scope: key })
        }
    }

    return result
}


function copyPackageJson(piecePath: string, distPath: string): void {
    const srcPackageJson = join(piecePath, 'package.json')
    if (!existsSync(srcPackageJson)) {
        return
    }
    copyFileSync(srcPackageJson, join(distPath, 'package.json'))
}

function copyI18nAssets(piecePath: string, distPath: string): void {
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

function symlinkNodeModules(piecePath: string, distPath: string): void {
    const srcNodeModules = resolve(piecePath, 'node_modules')
    const distNodeModules = join(distPath, 'node_modules')
    if (!existsSync(srcNodeModules) || existsSync(distNodeModules)) {
        return
    }
    symlinkSync(resolve(srcNodeModules), distNodeModules, 'dir')
}

function preparePieceDistForPublish(piecePath: string, rootDir: string, lockData?: BunLockData): void {
    const distPath = join(piecePath, 'dist')

    if (!existsSync(distPath)) {
        throw new Error(`[preparePiece] no dist output at ${distPath} for ${piecePath}`)
    }

    copyPackageJson(piecePath, distPath)
    copyI18nAssets(piecePath, distPath)
    symlinkNodeModules(piecePath, distPath)

    const resolvedLockData = lockData ?? parseBunLock(rootDir)
    const workspaceVersionMap = buildWorkspaceVersionMap(rootDir)

    const distPackageJsonPath = join(distPath, 'package.json')
    const json = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'))

    json.dependencies = stripSemverRanges(resolveWorkspaceDependencies(json.dependencies, workspaceVersionMap))
    json.devDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.devDependencies, workspaceVersionMap))
    json.peerDependencies = stripSemverRanges(resolveWorkspaceDependencies(json.peerDependencies, workspaceVersionMap))

    if (json.dependencies) {
        const transitiveDeps = flattenTransitiveDeps(json.dependencies, resolvedLockData)
        json.dependencies = { ...transitiveDeps, ...json.dependencies }
    }

    writeFileSync(distPackageJsonPath, JSON.stringify(json, null, 2) + '\n')
    console.info(`[preparePiece] prepared ${piecePath} (${Object.keys(json.dependencies ?? {}).length} deps)`)
}

export { parseBunLock, flattenTransitiveDeps, preparePieceDistForPublish }

type BunLockEntry = {
    pkgName: string
    version: string
    dependencies: Record<string, string>
}

type BunLockData = {
    resolvedVersions: Map<string, string>
    entries: Map<string, BunLockEntry>
}
