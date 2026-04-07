import { tryCatch } from '@activepieces/shared'
import { Logger } from 'pino'
import { system, WorkerSystemProp } from '../../config/configs'
import { CommandOutput, spawnWithKill } from '../../utils/exec'
import { bunRunner } from './bun-runner'
import { pnpmRunner } from './pnpm-runner'

let resolved: PackageManager | undefined

async function probeBun(): Promise<boolean> {
    const { error } = await tryCatch(async () => spawnWithKill({
        cmd: 'bun',
        args: ['--version'],
        printOutput: false,
        timeoutMs: 5_000,
    }))
    return error === null
}

export const packageManager = {
    async init(log: Logger): Promise<void> {
        if (resolved !== undefined) return

        const envValue = system.get(WorkerSystemProp.PACKAGE_MANAGER)?.toLowerCase()
        if (envValue === 'pnpm') {
            resolved = 'pnpm'
            log.info({ packageManager: resolved }, 'Package manager set via AP_PACKAGE_MANAGER')
            return
        }
        if (envValue === 'bun') {
            resolved = 'bun'
            log.info({ packageManager: resolved }, 'Package manager set via AP_PACKAGE_MANAGER')
            return
        }

        const bunAvailable = await probeBun()
        resolved = bunAvailable ? 'bun' : 'pnpm'
        log.info({ packageManager: resolved, bunAvailable }, 'Package manager auto-detected')
    },
    name(): PackageManager {
        if (resolved === undefined) {
            throw new Error('Package manager not initialized. Call packageManager.init() first.')
        }
        return resolved
    },
    runner(log: Logger): PackageManagerInstaller {
        const pm = this.name()
        switch (pm) {
            case 'pnpm':
                return pnpmRunner(log)
            case 'bun':
                return bunRunner(log)
        }
    },
    resetForTesting(): void {
        resolved = undefined
    },
}

type PackageManager = 'bun' | 'pnpm'

export type PackageManagerInstaller = {
    install(params: { path: string, filtersPath: string[] }): Promise<CommandOutput>
}
