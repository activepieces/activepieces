import { PathLike } from 'fs'
import { copyFile, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileSystemUtils } from '@activepieces/server-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ApEnvironment } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { SandboxPoolSettings } from '../../types'
import { cacheState, NO_SAVE_GUARD } from '../cache-state'

const engineExecutablePath = 'dist/packages/engine/main.js'
const ENGINE_CACHE_ID = nanoid()
const ENGINE_INSTALLED = 'ENGINE_INSTALLED'

export const engineInstaller = (_log: ApLogger, getSettings: () => SandboxPoolSettings) => ({
    async install({ path }: InstallParams): Promise<EngineInstallResult> {
        const isDev = getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
        // The egress proxy was removed, so there is a single engine bundle (main.js).
        const source = engineExecutablePath
        const cache = cacheState(path)
        const { cacheHit } = await cache.getOrSetCache({
            key: ENGINE_INSTALLED,
            cacheMiss: (key: string) => {
                const isEngineInstalled = key === ENGINE_CACHE_ID
                return !isEngineInstalled || isDev
            },
            installFn: async () => {
                await atomicCopy(source, `${path}/main.js`)
                await atomicCopy(`${source}.map`, `${path}/main.js.map`)
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
