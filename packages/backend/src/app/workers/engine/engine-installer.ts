import { copyFile } from 'node:fs/promises'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'
import { CodeExecutorSandboxType } from '@activepieces/shared'

const engineExecutablePath = system.getOrThrow(SystemProp.ENGINE_EXECUTABLE_PATH)

/**
 * Installs the engine executable to the given path
 */
export const engineInstaller = {
    async install({ path }: InstallParams): Promise<void> {
        logger.debug({ path }, '[engineInstaller#install]')

        await copyFile(engineExecutablePath, `${path}/main.js`)
        await copyFile(`${engineExecutablePath}.map`, `${path}/main.js.map`)
        const codeExecutionType = system.getOrThrow<CodeExecutorSandboxType>(SystemProp.CODE_EXECUTOR_SANDBOX_TYPE)
        if (codeExecutionType === CodeExecutorSandboxType.ISOLATE) {
            await installDependencies(path)
        }
    },
}

const installDependencies = async (path: string): Promise<void> => {
    await packageManager.add({
        path,
        dependencies: [
            {
                alias: 'isolated-vm',
                spec: '4.6.0',
            },
        ],
    })
}

type InstallParams = {
    path: string
}
