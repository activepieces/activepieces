import { isNil, tryCatch } from '@activepieces/core-utils'
import { type SandboxSettings } from '@activepieces/sandbox'
import { systemUsage } from '@activepieces/server-utils'
import { system, WorkerSystemProp } from '../config/configs'
import { logger } from '../config/logger'
import { workerSettings } from '../config/worker-settings'

let engineHeapCeilingKb: number | null = null

export const sandboxConfig = {
    getCacheBasePath(): string {
        return system.get(WorkerSystemProp.CACHE_BASE_PATH) ?? 'cache'
    },
    // The engine's --max-old-space-size and the worker's own heap are independent ceilings inside
    // ONE container. SANDBOX_MEMORY_LIMIT arrives from the app with no knowledge of the container,
    // so its 1024 MB default fills a 1 GiB cgroup on its own and the sum over-commits. Derive the
    // real ceiling from the cgroup once per (re)connect and clamp to it. Best-effort: when the
    // container limit is unreadable the configured value stands.
    async primeEngineHeapCeiling({ concurrency }: { concurrency: number }): Promise<void> {
        // Recomputed from scratch on every (re)connect, and reset to null whenever the limit is
        // unreadable or absent, so a ceiling derived from an earlier reading can never outlive it.
        engineHeapCeilingKb = null
        const { data: containerLimitInBytes, error } = await tryCatch(() => systemUsage.getContainerMemoryLimitInBytes())
        if (error) {
            logger.warn({ error }, 'Could not read the container memory limit, keeping configured sandbox memory limit')
            return
        }
        // No cgroup limit means the worker may use the whole host, so there is no container budget
        // to divide and nothing to clamp against — the operator's value stands.
        if (isNil(containerLimitInBytes)) {
            return
        }
        const containerKb = Math.floor(containerLimitInBytes / 1024)
        const availableKb = containerKb - WORKER_MEMORY_RESERVE_KB
        engineHeapCeilingKb = Math.max(MIN_ENGINE_HEAP_KB, Math.floor(availableKb / concurrency))
        const configuredKb = parseSandboxMemoryLimit(workerSettings.getSettings().SANDBOX_MEMORY_LIMIT)
        if (!isNil(configuredKb) && configuredKb > engineHeapCeilingKb) {
            logger.warn({ containerKb, concurrency, configuredKb, engineHeapCeilingKb }, 'Configured sandbox memory limit over-commits the container, clamping engine heap ceiling')
        }
    },
    // The worker's runtime settings mapped to what the pool reads. REUSE_SANDBOX is an env-only
    // override not present in WorkerSettings, so it is merged in here. Returns a fresh object each
    // call so the pool always sees the latest settings (the worker refetches them on reconnect).
    getSandboxSettings(): SandboxSettings {
        const settings = workerSettings.getSettings()
        return {
            ...settings,
            SANDBOX_MEMORY_LIMIT: clampToEngineHeapCeiling(settings.SANDBOX_MEMORY_LIMIT),
            REUSE_SANDBOX: system.get(WorkerSystemProp.REUSE_SANDBOX),
        }
    },
}

function parseSandboxMemoryLimit(memoryLimitKb: string): number | null {
    const parsed = parseInt(memoryLimitKb, 10)
    return Number.isNaN(parsed) ? null : parsed
}

function clampToEngineHeapCeiling(memoryLimitKb: string): string {
    if (isNil(engineHeapCeilingKb)) {
        return memoryLimitKb
    }
    const configuredKb = parseSandboxMemoryLimit(memoryLimitKb)
    if (isNil(configuredKb) || configuredKb <= engineHeapCeilingKb) {
        return memoryLimitKb
    }
    return String(engineHeapCeilingKb)
}

// Held back for the worker process itself plus native overhead (isolate, socket buffers). The
// worker's measured steady state on cloud is 200-230 MB; the rest is slack for its per-run spikes.
const WORKER_MEMORY_RESERVE_KB = 320 * 1024
// A floor so a mis-sized container degrades into small runs rather than an engine that cannot boot.
const MIN_ENGINE_HEAP_KB = 128 * 1024
