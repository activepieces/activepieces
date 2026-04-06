import { Logger } from 'pino'
import { system, WorkerSystemProp } from '../../config/configs'
import { CommandOutput } from '../../utils/exec'
import { bunRunner } from './bun-runner'
import { pnpmRunner } from './pnpm-runner'

function getPackageManager(): PackageManager {
    const value = system.get(WorkerSystemProp.PACKAGE_MANAGER)?.toLowerCase()
    if (value === 'pnpm') return 'pnpm'
    return 'bun'
}

export const packageManagerRunner = (log: Logger): PackageManagerInstaller => {
    const pm = getPackageManager()
    switch (pm) {
        case 'pnpm':
            return pnpmRunner(log)
        case 'bun':
            return bunRunner(log)
    }
}

export const packageManagerName = getPackageManager()

type PackageManager = 'bun' | 'pnpm'

export type PackageManagerInstaller = {
    install(params: { path: string, filtersPath: string[] }): Promise<CommandOutput>
}
