import { PathLike } from 'fs'
import { copyFile, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileSystemUtils } from '@activepieces/server-utils'
import { ApEnvironment } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { Logger } from 'pino'
import { workerSettings } from '../../config/worker-settings'
import { cacheState, NO_SAVE_GUARD } from '../cache-state'

const engineExecutablePath = 'dist/packages/engine/main.js'
const ENGINE_CACHE_ID = nanoid()
const ENGINE_INSTALLED = 'ENGINE_INSTALLED'

export const engineInstaller = (_log: Logger) => ({
    async install({ path }: InstallParams): Promise<EngineInstallResult> {
        const isDev = workerSettings.getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
        const cache = cacheState(path)
        const { cacheHit } = await cache.getOrSetCache({
            key: ENGINE_INSTALLED,
            cacheMiss: (key: string) => {
                const isEngineInstalled = key === ENGINE_CACHE_ID
                return !isEngineInstalled || isDev
            },
            installFn: async () => {
                await atomicCopy(engineExecutablePath, `${path}/main.js`)
                await atomicCopy(`${engineExecutablePath}.map`, `${path}/main.js.map`)
                return ENGINE_CACHE_ID
            },
            skipSave: NO_SAVE_GUARD,
        })
        return { cacheHit }
    },
})

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, `engine.temp.${nanoid()}.js`)
    await fileSystemUtils.threadSafeMkdir(destDir)
    await copyFile(src, tempPath)
    await rename(tempPath, dest)
}

type InstallParams = {
    path: string
}

type EngineInstallResult = {
    cacheHit: boolean
}
