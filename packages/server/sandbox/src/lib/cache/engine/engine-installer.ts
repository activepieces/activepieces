import { PathLike } from 'fs'
import { copyFile, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { fileSystemUtils } from '@activepieces/server-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { SandboxSettings } from '../../types'

const engineDistPath = 'dist/packages/engine'
const engineBundles = ['main.js', 'piece-child.js']
const installedPaths = new Map<string, Promise<void>>()
const renameRetryDelaysMs = [25, 50, 100, 200, 400]
const contendedRenameCodes = ['EPERM', 'EACCES', 'EBUSY']

export const engineInstaller = (_log: ApLogger, getSettings: () => SandboxSettings) => ({
    async install({ path }: InstallParams): Promise<EngineInstallResult> {
        const isDev = getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
        const inFlight = installedPaths.get(path)
        if (!isNil(inFlight) && !isDev) {
            await inFlight
            return { cacheHit: true }
        }
        const install = copyEngine({ path })
        installedPaths.set(path, install)
        const { error } = await tryCatch(() => install)
        if (error) {
            installedPaths.delete(path)
            throw error
        }
        return { cacheHit: false }
    },
})

async function copyEngine({ path }: CopyEngineParams): Promise<void> {
    for (const bundle of engineBundles) {
        await atomicCopy({ src: `${engineDistPath}/${bundle}`, dest: `${path}/${bundle}` })
        await atomicCopy({ src: `${engineDistPath}/${bundle}.map`, dest: `${path}/${bundle}.map` })
    }
}

async function atomicCopy({ src, dest }: AtomicCopyParams): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, `engine.temp.${nanoid()}.js`)
    await fileSystemUtils.threadSafeMkdir(destDir)
    await copyFile(src, tempPath)
    const { error } = await tryCatch(() => renameWithRetry({ tempPath, dest }))
    if (isNil(error)) {
        return
    }
    await tryCatch(() => fileSystemUtils.deleteFile(tempPath))
    const destAlreadyInstalled = isContendedRenameError(error) && await fileSystemUtils.fileExists(dest.toString())
    if (!destAlreadyInstalled) {
        throw error
    }
}

async function renameWithRetry({ tempPath, dest }: RenameWithRetryParams): Promise<void> {
    for (const delayMs of renameRetryDelaysMs) {
        const { error } = await tryCatch(() => rename(tempPath, dest))
        if (isNil(error)) {
            return
        }
        if (!isContendedRenameError(error)) {
            throw error
        }
        await delay(delayMs)
    }
    await rename(tempPath, dest)
}

function isContendedRenameError(error: Error): boolean {
    return 'code' in error && contendedRenameCodes.includes(String(error.code))
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

type CopyEngineParams = {
    path: string
}

type AtomicCopyParams = {
    src: PathLike
    dest: PathLike
}

type RenameWithRetryParams = {
    tempPath: string
    dest: PathLike
}

type InstallParams = {
    path: string
}

type EngineInstallResult = {
    cacheHit: boolean
}
