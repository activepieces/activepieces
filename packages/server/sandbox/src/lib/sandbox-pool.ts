import { isNil } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { Sandbox, SandboxFactory, SandboxLogger, SandboxPool, SandboxPoolInitOptions } from './types'

export function createSandboxPool(sandboxFactory: SandboxFactory): SandboxPool {
    const sandboxes: Map<string, Sandbox> = new Map()
    const sandboxGenerations: Map<string, number> = new Map()
    let sandboxQueue: string[] = []
    let workerConcurrency = 0
    let reusable = false
    let getGeneration: () => number = () => 0

    return {
        getTotalSandboxes: () => {
            return workerConcurrency - sandboxQueue.length
        },
        getFreeSandboxes: () => {
            return sandboxQueue.length
        },
        init: (_log: SandboxLogger, options: SandboxPoolInitOptions) => {
            workerConcurrency = options.concurrency
            reusable = options.reusable
            getGeneration = options.getGeneration
            sandboxQueue = Array.from({ length: workerConcurrency }, () => nanoid())
        },
        allocate: async (log: SandboxLogger): Promise<Sandbox> => {
            const sandboxId = sandboxQueue.shift()
            if (!sandboxId) {
                throw new Error('No sandbox available')
            }
            const currentGeneration = getGeneration()
            const existingSandbox = sandboxes.get(sandboxId)
            if (!isNil(existingSandbox)) {
                const sandboxGeneration = sandboxGenerations.get(sandboxId) ?? 0
                if (sandboxGeneration < currentGeneration) {
                    log.debug({ sandboxId, sandboxGeneration: String(sandboxGeneration) }, 'Sandbox generation stale, restarting')
                    await existingSandbox.shutdown()
                    sandboxes.delete(sandboxId)
                    sandboxGenerations.delete(sandboxId)
                }
                else {
                    log.debug({ sandboxId, sandboxGeneration: String(sandboxGeneration) }, 'Sandbox generation is up to date, reusing')
                    return existingSandbox
                }
            }
            const newSandbox = sandboxFactory(log, sandboxId)
            sandboxes.set(sandboxId, newSandbox)
            sandboxGenerations.set(sandboxId, currentGeneration)
            return newSandbox
        },
        release: async (sandbox: Sandbox | undefined, log?: SandboxLogger) => {
            if (isNil(sandbox)) {
                return
            }
            log?.info({
                sandboxId: sandbox.id,
            }, '[SandboxPool] Releasing sandbox')
            if (!reusable) {
                await sandbox.shutdown()
                sandboxes.delete(sandbox.id)
            }
            sandboxQueue.push(sandbox.id)
        },
        drain: async () => {
            for (const sandbox of sandboxes.values()) {
                await sandbox.shutdown()
            }
            sandboxes.clear()
            sandboxGenerations.clear()
        },
    }
}
