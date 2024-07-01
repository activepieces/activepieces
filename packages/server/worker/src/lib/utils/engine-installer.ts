import { copyFile } from 'node:fs/promises'
import { fileExists, logger, system, SystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'

const engineExecutablePath = system.getOrThrow(
    SystemProp.ENGINE_EXECUTABLE_PATH,
)

/**
 * Installs the engine executable to the given path
 */
export const engineInstaller = {
    async install({ path }: InstallParams): Promise<void> {
        logger.debug({ path }, '[engineInstaller#install]')
        const isDev = system.getOrThrow(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT

        const engineFileExists = await fileExists(`${path}/main.js`)
        if (!engineFileExists || isDev) {
            await copyFile(engineExecutablePath, `${path}/main.js`)
        }
        const engineMapFileExists = await fileExists(`${path}/main.js.map`)
        if (!engineMapFileExists || isDev) {
            await copyFile(`${engineExecutablePath}.map`, `${path}/main.js.map`)
        }
    },
}

type InstallParams = {
    path: string
}
