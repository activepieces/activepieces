import { PathLike } from 'fs'
import { copyFile, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { fileSystemUtils } from '@activepieces/server-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { SandboxSettings } from '../../types'

const engineExecutablePath = 'dist/packages/engine/main.js'
const installedPaths = new Map<string, Promise<void>>()

export const engineInstaller = (_log: ApLogger, getSettings: () => SandboxSettings) => ({
    async install({ path }: InstallParams): Promise<EngineInstallResult> {
        const isDev = getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
        // The egress proxy was removed, so there is a single engine bundle (main.js).
        const source = engineExecutablePath
        const inFlight = installedPaths.get(path)
        if (!isNil(inFlight) && !isDev) {
            await inFlight
            return { cacheHit: true }
        }
        const install = copyEngine({ source, path })
        installedPaths.set(path, install)
        const { error } = await tryCatch(() => install)
        if (error) {
            installedPaths.delete(path)
            throw error
        }
        return { cacheHit: false }
    },
})

async function copyEngine({ source, path }: CopyEngineParams): Promise<void> {
    await atomicCopy(source, `${path}/main.js`)
    await atomicCopy(`${source}.map`, `${path}/main.js.map`)
}

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, `engine.temp.${nanoid()}.js`)
    await fileSystemUtils.threadSafeMkdir(destDir)
    await copyFile(src, tempPath)
    await rename(tempPath, dest)
}

type CopyEngineParams = {
    source: string
    path: string
}

type InstallParams = {
    path: string
}

type EngineInstallResult = {
    cacheHit: boolean
}
