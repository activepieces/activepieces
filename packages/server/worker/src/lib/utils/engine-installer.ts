import { copyFile } from 'node:fs/promises'
import { fileExists, logger, memoryLock, SharedSystemProp, system } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'

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
            logger.debug({ path }, '[engineInstaller#install]')
            const engineFileExists = await fileExists(`${path}/main.js`)
            if (!engineFileExists || isDev) {
                await copyFile(engineExecutablePath, `${path}/main.js`)
            }
            const engineMapFileExists = await fileExists(`${path}/main.js.map`)
            if (!engineMapFileExists || isDev) {
                await copyFile(`${engineExecutablePath}.map`, `${path}/main.js.map`)
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
