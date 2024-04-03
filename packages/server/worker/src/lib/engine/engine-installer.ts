import { copyFile } from 'node:fs/promises'
import { logger, system, SystemProp } from '@activepieces/server-shared'

const engineExecutablePath = system.getOrThrow(
    SystemProp.ENGINE_EXECUTABLE_PATH,
)

/**
 * Installs the engine executable to the given path
 */
export const engineInstaller = {
    async install({ path }: InstallParams): Promise<void> {
        logger.debug({ path }, '[engineInstaller#install]')

        await copyFile(engineExecutablePath, `${path}/main.js`)
        await copyFile(`${engineExecutablePath}.map`, `${path}/main.js.map`)
    },
}

type InstallParams = {
    path: string
}
