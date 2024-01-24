import { copyFile } from 'node:fs/promises'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'
import { CodeSandboxType } from '@activepieces/shared'

const engineExecutablePath = system.getOrThrow(SystemProp.ENGINE_EXECUTABLE_PATH)

/**
 * Installs the engine executable to the given path
 */
export const engineInstaller = {
    async install({ path }: InstallParams): Promise<void> {
        logger.debug({ path }, '[engineInstaller#install]')

        await copyFile(engineExecutablePath, `${path}/main.js`)
        await copyFile(`${engineExecutablePath}.map`, `${path}/main.js.map`)
        await installDependencies(path)
    },
}

const installDependencies = async (path: string): Promise<void> => {
    const codeSandboxType = system.getOrThrow<CodeSandboxType>(SystemProp.CODE_SANDBOX_TYPE)
    const codSandboxTypeIsV8Isolate = codeSandboxType === CodeSandboxType.V8_ISOLATE

    if (codSandboxTypeIsV8Isolate) {
        await packageManager.link({
            path,
            global: true,
            packageName: 'isolated-vm',
        })
    }
}

type InstallParams = {
    path: string
}
