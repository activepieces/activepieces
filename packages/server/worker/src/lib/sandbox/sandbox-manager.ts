import { logger } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { Sandbox } from '.'

const SANDBOX_LIMIT = 1000

const sandboxes: Sandbox[] = new Array(SANDBOX_LIMIT)
    .fill(null)
    .map((_, i) => new Sandbox({ boxId: i }))

const lock: Mutex = new Mutex()

export const sandboxManager = {
    async allocate(cacheKey: string): Promise<Sandbox> {
        logger.debug({ cacheKey }, '[SandboxManager#allocate]')

        const sandbox = await executeWithLock((): Sandbox => {
            const sandbox = findSandbox(cacheKey)

            if (isNil(sandbox)) {
                throw new Error('[SandboxManager#allocate] all sandboxes are in-use')
            }

            sandbox.inUse = true
            return sandbox
        })

        try {
            await sandbox.cleanUp()
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


function findSandbox(cacheKey: string): Sandbox | undefined {
    const sandboxByKey = sandboxes.find(f => f.cacheKey === cacheKey && !f.inUse)
    if (!isNil(sandboxByKey)) {
        return sandboxByKey
    }
    const uncachedSandbox = sandboxes.find(f => !f.inUse && isNil(f.cacheKey))
    if (!isNil(uncachedSandbox)) {
        return uncachedSandbox
    }
    return sandboxes.find(f => !f.inUse)
}

