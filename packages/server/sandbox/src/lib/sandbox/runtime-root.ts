import { chmod, copyFile, cp, mkdir, readdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { spawnWithKill } from '../utils/exec'
import { SandboxLogger } from './types'

let ensuredRoot: Promise<string> | null = null

function ensure({ log }: { log: SandboxLogger }): Promise<string> {
    if (isNil(ensuredRoot)) {
        ensuredRoot = build({ log, rootPath: SANDBOX_RUNTIME_ROOT_PATH, sources: defaultSources({ env: process.env, execPath: process.execPath }) }).catch((error: unknown) => {
            ensuredRoot = null
            throw error
        })
    }
    return ensuredRoot
}

async function build({ log, rootPath, sources, listSharedLibraries = lddSharedLibraries }: BuildParams): Promise<string> {
    const startedAt = Date.now()
    const plan = await planRuntimeRoot({ sources, listSharedLibraries })
    const fingerprint = JSON.stringify(plan)
    const existing = await tryCatch(() => readFile(path.join(rootPath, MANIFEST_FILE), 'utf8'))
    if (existing.data === fingerprint) {
        log.info({ rootPath, files: plan.files.length }, '[sandboxRuntimeRoot] Reusing sandbox runtime root')
        return rootPath
    }

    const stagingPath = `${rootPath}.staging-${process.pid}-${Date.now()}`
    await rm(stagingPath, { recursive: true, force: true })
    const { error } = await tryCatch(async () => {
        for (const file of plan.files) {
            await copyIntoRoot({ rootPath: stagingPath, boxPath: file.boxPath, sourcePath: file.sourcePath })
        }
        for (const directory of plan.directories) {
            await cp(directory.sourcePath, path.join(stagingPath, directory.boxPath), { recursive: true, dereference: true })
        }
        await writeFile(path.join(stagingPath, MANIFEST_FILE), fingerprint)
        await swapIntoPlace({ stagingPath, rootPath, fingerprint })
    })
    if (error) {
        await rm(stagingPath, { recursive: true, force: true })
        throw error
    }

    log.info({
        rootPath,
        files: plan.files.map((file) => file.boxPath),
        directories: plan.directories.map((directory) => directory.boxPath),
        durationMs: Date.now() - startedAt,
    }, '[sandboxRuntimeRoot] Built sandbox runtime root')
    return rootPath
}

function mountArgs({ rootPath }: { rootPath: string }): string[] {
    return BOX_MOUNT_ROOTS.map((root) => `--dir=${root}=${path.join(rootPath, root)}${root === '/usr' ? '' : ':maybe'}`)
}

function parseLddOutput({ output }: { output: string }): LddResult {
    const lines = output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
    const missing = lines.filter((line) => line.includes('=> not found')).map((line) => line.split(' ')[0])
    const libraries = lines.flatMap((line) => {
        const resolved = /=>\s+(\/\S+)/.exec(line)
        if (resolved) {
            return [resolved[1]]
        }
        const direct = /^(\/\S+)\s+\(0x/.exec(line)
        return direct ? [direct[1]] : []
    })
    return { libraries, missing }
}

async function planRuntimeRoot({ sources, listSharedLibraries }: PlanParams): Promise<RuntimeRootPlan> {
    const presentOptional = await filterExisting({ paths: sources.optionalExecutables })
    const executables = [...sources.executables, ...presentOptional]
    const directories = await filterExisting({ paths: sources.directories })
    const dataFiles = await filterExisting({ paths: sources.dataFiles })
    const nativeAddons = (await Promise.all(directories.map((directory) => findNativeAddons({ directory })))).flat()

    const requiredLibraries = await Promise.all(executables.map(async (executable) => {
        const result = await listSharedLibraries({ file: executable })
        if (isNil(result) || result.missing.length > 0) {
            throw new Error(`[sandboxRuntimeRoot] Cannot resolve shared libraries for ${executable}: missing ${result?.missing.join(', ') ?? 'ldd output'}`)
        }
        return result.libraries
    }))
    const addonLibraries = await Promise.all(nativeAddons.map(async (addon) => (await listSharedLibraries({ file: addon }))?.libraries ?? []))

    const boxPaths = unique({ values: [...executables, ...requiredLibraries.flat(), ...addonLibraries.flat(), ...dataFiles] })
        .filter((boxPath) => !directories.some((directory) => boxPath.startsWith(`${directory}/`)))
        .sort()

    const files = await Promise.all(boxPaths.map(async (boxPath) => {
        const sourcePath = await realpath(boxPath)
        const info = await stat(sourcePath)
        return { boxPath, sourcePath, size: info.size, mtimeMs: info.mtimeMs }
    }))
    const plannedDirectories = await Promise.all(directories.map(async (directory) => {
        const sourcePath = await realpath(directory)
        const info = await stat(sourcePath)
        return { boxPath: directory, sourcePath, mtimeMs: info.mtimeMs }
    }))
    return { files, directories: plannedDirectories }
}

async function lddSharedLibraries({ file }: { file: string }): Promise<LddResult | null> {
    const { data, error } = await tryCatch(() => spawnWithKill({ cmd: 'ldd', args: [file], timeoutMs: 30_000 }))
    if (error) {
        return null
    }
    return parseLddOutput({ output: data.stdout })
}

async function findNativeAddons({ directory }: { directory: string }): Promise<string[]> {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true })
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.node'))
        .map((entry) => path.join(entry.parentPath, entry.name))
}

async function filterExisting({ paths }: { paths: string[] }): Promise<string[]> {
    const checks = await Promise.all(paths.map(async (candidate) => ({ candidate, exists: !(await tryCatch(() => stat(candidate))).error })))
    return checks.filter((check) => check.exists).map((check) => check.candidate)
}

async function copyIntoRoot({ rootPath, boxPath, sourcePath }: { rootPath: string, boxPath: string, sourcePath: string }): Promise<void> {
    const destination = path.join(rootPath, boxPath)
    await mkdir(path.dirname(destination), { recursive: true })
    await copyFile(sourcePath, destination)
    const { mode } = await stat(sourcePath)
    await chmod(destination, mode & 0o755)
}

async function swapIntoPlace({ stagingPath, rootPath, fingerprint }: { stagingPath: string, rootPath: string, fingerprint: string }): Promise<void> {
    const previousPath = `${rootPath}.previous-${process.pid}-${Date.now()}`
    await tryCatch(() => rename(rootPath, previousPath))
    const { error } = await tryCatch(() => rename(stagingPath, rootPath))
    await rm(previousPath, { recursive: true, force: true })
    if (isNil(error)) {
        return
    }
    await rm(stagingPath, { recursive: true, force: true })
    const winner = await tryCatch(() => readFile(path.join(rootPath, MANIFEST_FILE), 'utf8'))
    if (winner.data !== fingerprint) {
        throw error
    }
}

function defaultSources({ env, execPath }: { env: NodeJS.ProcessEnv, execPath: string }): RuntimeRootSources {
    const denoPath = env['AP_DENO_PATH']
    const extraCaCerts = env['NODE_EXTRA_CA_CERTS']
    return {
        executables: [execPath, ...(isNil(denoPath) ? [] : [denoPath])],
        optionalExecutables: ['/bin/sh', '/usr/bin/pdftoppm'],
        directories: ['/usr/src/node_modules'],
        dataFiles: isNil(extraCaCerts) || !isMountedInBox({ filePath: extraCaCerts }) ? [] : [path.posix.normalize(extraCaCerts)],
    }
}

function isMountedInBox({ filePath }: { filePath: string }): boolean {
    const normalized = path.posix.normalize(filePath)
    return BOX_MOUNT_ROOTS.some((root) => normalized.startsWith(`${root}/`))
}

function unique({ values }: { values: string[] }): string[] {
    return [...new Set(values)]
}

export const sandboxRuntimeRoot = {
    ensure,
    build,
    mountArgs,
    parseLddOutput,
    defaultSources,
}

export const SANDBOX_RUNTIME_ROOT_PATH = '/var/lib/activepieces/sandbox-root'
const MANIFEST_FILE = '.manifest.json'
const BOX_MOUNT_ROOTS = ['/usr', '/lib', '/lib64', '/bin']

export type RuntimeRootSources = {
    executables: string[]
    optionalExecutables: string[]
    directories: string[]
    dataFiles: string[]
}

export type LddResult = {
    libraries: string[]
    missing: string[]
}

type ListSharedLibraries = (params: { file: string }) => Promise<LddResult | null>

type BuildParams = {
    log: SandboxLogger
    rootPath: string
    sources: RuntimeRootSources
    listSharedLibraries?: ListSharedLibraries
}

type PlanParams = {
    sources: RuntimeRootSources
    listSharedLibraries: ListSharedLibraries
}

type RuntimeRootPlan = {
    files: { boxPath: string, sourcePath: string, size: number, mtimeMs: number }[]
    directories: { boxPath: string, sourcePath: string, mtimeMs: number }[]
}
