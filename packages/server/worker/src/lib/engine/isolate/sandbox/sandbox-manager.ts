import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { FastifyBaseLogger } from 'fastify'
import { IsolateSandbox } from './isolate-sandbox'

const SANDBOX_LIMIT = 1000

const sandboxes: IsolateSandbox[] = new Array(SANDBOX_LIMIT)
    .fill(null)
    .map((_, i) => new IsolateSandbox({ boxId: i }))

const lock: Mutex = new Mutex()

export const sandboxManager = (log: FastifyBaseLogger) => ({
    async allocate(): Promise<IsolateSandbox> {

        const sandbox = await executeWithLock((): IsolateSandbox => {
            const sandbox = sandboxes.find(f => !f.inUse)

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
            log.error(e, '[SandboxManager#allocate]')
            await this.release(sandbox.boxId)
            throw e
        }
    },

    async release(sandboxId: number): Promise<void> {
        log.debug({ boxId: sandboxId }, '[SandboxManager#release]')

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
})

const executeWithLock = async <T>(methodToExecute: () => T): Promise<T> => {
    const releaseLock = await lock.acquire()

    try {
        return methodToExecute()
    }
    finally {
        releaseLock()
    }
}

