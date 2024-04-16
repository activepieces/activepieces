import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { logger } from '../../logger'
import { Sandbox } from './core'

const SANDBOX_LIMIT = 1000

const sandboxes: Sandbox[] = new Array(SANDBOX_LIMIT)
    .fill(null)
    .map((_, i) => new Sandbox({ boxId: i }))

const lock: Mutex = new Mutex()

export const sandboxManager = {
    async allocate(): Promise<Sandbox> {
        logger.debug('[SandboxManager#allocate]')

        const sandbox = await executeWithLock((): Sandbox => {
            const sandbox = sandboxes.find(byNotInUse)

            if (isNil(sandbox)) {
                throw new Error('[SandboxManager#allocate] all sandboxes are in-use')
            }

            sandbox.inUse = true
            return sandbox
        })

        try {
            await sandbox.recreate()
            return sandbox
        }
        catch (e) {
            logger.error(e, '[SandboxManager#allocate]')
            await this.release(sandbox.boxId)
            throw e
        }
    },

    async release(sandboxId: number): Promise<void> {
        logger.debug({ boxId: sandboxId }, '[SandboxManager#release]')

        await executeWithLock((): void => {
            const sandbox = sandboxes[sandboxId]

            if (isNil(sandbox)) {
                throw new Error(
                    `[SandboxManager#release] sandbox not found id=${sandboxId}`,
                )
            }

            sandbox.inUse = false
        })
    },
}

const executeWithLock = async <T>(methodToExecute: () => T): Promise<T> => {
    const releaseLock = await lock.acquire()

    try {
        return methodToExecute()
    }
    finally {
        releaseLock()
    }
}

const byNotInUse = (s: Sandbox): boolean => !s.inUse
