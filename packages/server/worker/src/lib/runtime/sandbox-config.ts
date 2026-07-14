import { isNil, tryCatch } from '@activepieces/core-utils'
import { type SandboxSettings } from '@activepieces/sandbox'
import { systemUsage } from '@activepieces/server-utils'
import { system, WorkerSystemProp } from '../config/configs'
import { logger } from '../config/logger'
import { workerSettings } from '../config/worker-settings'

let fullContainerMemoryKb: number | null = null

export const sandboxConfig = {
    getCacheBasePath(): string {
        return system.get(WorkerSystemProp.CACHE_BASE_PATH) ?? 'cache'
    },
    // At concurrency 1 the single sandbox is the only engine on the box, so it gets the full
    // container memory instead of the fixed server-provided SANDBOX_MEMORY_LIMIT. Called once
    // per (re)connect from startPollingWorkers; best-effort — on failure the server limit stays.
    async primeFullContainerMemory(): Promise<void> {
        const { data, error } = await tryCatch(() => systemUsage.getContainerMemoryUsage())
        if (error) {
            logger.warn({ error }, 'Could not read container memory, keeping configured sandbox memory limit')
            return
        }
        fullContainerMemoryKb = Math.floor(data.totalRamInBytes / 1024)
        logger.info({ fullContainerMemoryKb }, 'Concurrency is 1 — sandbox memory limit set to full container memory')
    },
    // The worker's runtime settings mapped to what the pool reads. REUSE_SANDBOX is an env-only
    // override not present in WorkerSettings, so it is merged in here. Returns a fresh object each
    // call so the pool always sees the latest settings (the worker refetches them on reconnect).
    getSandboxSettings(): SandboxSettings {
        return {
            ...workerSettings.getSettings(),
            ...(isNil(fullContainerMemoryKb) ? {} : { SANDBOX_MEMORY_LIMIT: String(fullContainerMemoryKb) }),
            REUSE_SANDBOX: system.get(WorkerSystemProp.REUSE_SANDBOX),
        }
    },
}
