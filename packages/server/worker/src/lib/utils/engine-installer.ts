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
            await copyEngineFile({ path, fileName: 'main.js' })
            await copyEngineFile({ path, fileName: 'main.js.map' })
        }
        finally {
            await lock.release()
        }
    },
}

async function copyEngineFile({ path, fileName }: { path: string, fileName: string }): Promise<void> {
    const engineFileExists = await fileExists(`${path}/${fileName}`)
    if (!engineFileExists || isDev) {
        await copyFile(engineExecutablePath, `${path}/${fileName}`)
    }
}

type InstallParams = {
    path: string
}
