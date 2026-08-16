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
    // so its 1024 MB default fills a 1 GiB cgroup on its own and the sum over-commits. This derives
    // the real ceiling from the cgroup, and returns null when there is nothing to clamp against —
    // either the limit was unreadable or no limit exists, in which case the operator's value stands.
    //
    // Deliberately pure: it reads the cgroup but writes no shared state, so a caller suspended on
    // this await can be abandoned without its result ever reaching a live runtime. Assignment is a
    // separate, synchronous step the caller takes once it knows it is still the current generation.
    async deriveEngineHeapCeilingKb({ concurrency }: { concurrency: number }): Promise<number | null> {
        const { data: containerLimitInBytes, error } = await tryCatch(() => systemUsage.getContainerMemoryLimitInBytes())
        if (error) {
            logger.warn({ error }, 'Could not read the container memory limit, keeping configured sandbox memory limit')
            return null
        }
        if (isNil(containerLimitInBytes)) {
            return null
        }
        const containerKb = Math.floor(containerLimitInBytes / 1024)
        const availableKb = containerKb - WORKER_MEMORY_RESERVE_KB
        return Math.max(MIN_ENGINE_HEAP_KB, Math.floor(availableKb / concurrency))
    },
    // Replaces the ceiling wholesale, including with null, so one derived from an earlier reading
    // can never outlive it.
    applyEngineHeapCeiling(ceilingKb: number | null): void {
        engineHeapCeilingKb = ceilingKb
        const configuredKb = parseSandboxMemoryLimit(workerSettings.getSettings().SANDBOX_MEMORY_LIMIT)
        if (!isNil(ceilingKb) && !isNil(configuredKb) && configuredKb > ceilingKb) {
            logger.warn({ configuredKb, engineHeapCeilingKb: ceilingKb }, 'Configured sandbox memory limit over-commits the container, clamping engine heap ceiling')
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
