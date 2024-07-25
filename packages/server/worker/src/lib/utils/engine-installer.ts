import { copyFile } from 'node:fs/promises'
import { logger, memoryLock, SharedSystemProp, system } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { cacheHandler, CacheState } from './cache-handler'

const engineExecutablePath = system.getOrThrow(
    SharedSystemProp.ENGINE_EXECUTABLE_PATH,
)
const isDev = system.getOrThrow(SharedSystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT

/**
 * Installs the engine executable to the given path
 */
export const engineInstaller = {
    async install({ path }: InstallParams): Promise<void> {
        const lock = await memoryLock.acquire(`engineInstaller#${path}`)
        try {

            const cache = cacheHandler(path) 
            
            const engineFileExists =  await cache.cacheCheckState('main.js') === CacheState.READY
            logger.debug({ path }, '[engineInstaller#install]')
            if (!engineFileExists || isDev) {
                await copyFile(engineExecutablePath, `${path}/main.js`) 
                await cache.setCache('main.js', CacheState.READY)
            }
            const engineMapFileExists =  await cache.cacheCheckState('main.js.map') === CacheState.READY
            if (!engineMapFileExists || isDev) {
                await copyFile(`${engineExecutablePath}.map`, `${path}/main.js.map`)
                await cache.setCache('main.js.map', CacheState.READY)
            }
        }
        finally {
            await lock.release()
        }
    },
}

type InstallParams = {
    path: string
}
