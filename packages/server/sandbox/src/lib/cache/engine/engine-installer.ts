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
        await atomicCopy(`${engineDistPath}/${bundle}`, `${path}/${bundle}`)
        await atomicCopy(`${engineDistPath}/${bundle}.map`, `${path}/${bundle}.map`)
    }
}

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, `engine.temp.${nanoid()}.js`)
    await fileSystemUtils.threadSafeMkdir(destDir)
    await copyFile(src, tempPath)
    await rename(tempPath, dest)
}

type CopyEngineParams = {
    path: string
}

type InstallParams = {
    path: string
}

type EngineInstallResult = {
    cacheHit: boolean
}
