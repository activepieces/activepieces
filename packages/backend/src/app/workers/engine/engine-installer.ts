import { copyFile } from 'node:fs/promises'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'

const engineExecutablePath = system.getOrThrow(SystemProp.ENGINE_EXECUTABLE_PATH)

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
