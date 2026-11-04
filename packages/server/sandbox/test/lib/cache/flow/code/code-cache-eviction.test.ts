import { randomUUID } from 'node:crypto'
import { mkdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apId } from '@activepieces/core-utils'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { ACTION_RUN_CACHE_ACTIVE_WINDOW_MS, actionRunCache } from '../../../../../src/lib/cache/action-run-cache'
import { cacheUtils } from '../../../../../src/lib/cache/cache-paths'
import { codeCacheEviction, DISK_EVICTION_THRESHOLD_PERCENT } from '../../../../../src/lib/cache/flow/code/code-cache-eviction'
import { pendingCacheRemovals } from '../../../../../src/lib/cache/pending-cache-removals'

const basePaths: string[] = []

function uniqueBasePath(): string {
    const basePath = join(tmpdir(), `code-cache-eviction-test-${randomUUID()}`)
    basePaths.push(basePath)
    return basePath
}

function createNoopLog(): ApLogger {
    const log: ApLogger = {
        level: 'silent',
        silent: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
        child: () => log,
    }
    return log
}

const noopLog = createNoopLog()

function flowVersionDir({ basePath, flowVersionId }: { basePath: string, flowVersionId: string }): string {
    return join(cacheUtils(basePath).getGlobalCodeCachePath(), flowVersionId)
}

async function seedStepDir({ basePath, flowVersionId, stepName = 'step_1', ageMs }: SeedParams): Promise<string> {
    const stepPath = join(flowVersionDir({ basePath, flowVersionId }), stepName)
    await mkdir(stepPath, { recursive: true })
    await writeFile(join(stepPath, 'index.ts'), 'export const code = async () => 42', 'utf8')
    const mtime = new Date(Date.now() - ageMs)
    await utimes(stepPath, mtime, mtime)
    return stepPath
}

function underThreshold(): Promise<number> {
    return Promise.resolve(DISK_EVICTION_THRESHOLD_PERCENT - 1)
}

// sweep() calls getUsedPercent() once before the loop (the initial gate check) plus once per
// candidate considered, so driving N evictions needs N+1 "over threshold" answers.
function overThresholdForEvictions(evictionsWanted: number): () => Promise<number> {
    let overCallsLeft = evictionsWanted + 1
    return async () => {
        if (overCallsLeft <= 0) {
            return DISK_EVICTION_THRESHOLD_PERCENT - 1
        }
        overCallsLeft -= 1
        return DISK_EVICTION_THRESHOLD_PERCENT + 1
    }
}

async function exists(path: string): Promise<boolean> {
    try {
        await stat(path)
        return true
    }
    catch {
        return false
    }
}

afterEach(async () => {
    for (const basePath of basePaths) {
        await rm(basePath, { recursive: true, force: true })
    }
    basePaths.length = 0
})

describe('codeCacheEviction.sweep', () => {
    it('does nothing while disk usage is under the threshold', async () => {
        const basePath = uniqueBasePath()
        const oldStep = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 30 * 24 * 60 * 60 * 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(oldStep)).resolves.toBe(true)
    })

    it('evicts the oldest step caches first once disk usage is over the threshold', async () => {
        const basePath = uniqueBasePath()
        const oldest = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 3 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const middle = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const newest = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(1) })

        await expect(exists(oldest)).resolves.toBe(false)
        await expect(exists(middle)).resolves.toBe(true)
        await expect(exists(newest)).resolves.toBe(true)
    })

    it('stops evicting as soon as disk usage drops back under the threshold', async () => {
        const basePath = uniqueBasePath()
        const steps = await Promise.all(Array.from({ length: 5 }, (_, index) =>
            seedStepDir({
                basePath,
                flowVersionId: apId(),
                ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + (5 - index) * 1000,
            }),
        ))

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(2) })

        await expect(exists(steps[0])).resolves.toBe(false)
        await expect(exists(steps[1])).resolves.toBe(false)
        for (const stepPath of steps.slice(2)) {
            await expect(exists(stepPath)).resolves.toBe(true)
        }
    })

    it('leaves a recently-used step cache alone even when disk usage is over the threshold', async () => {
        const basePath = uniqueBasePath()
        const activeStep = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(10) })

        await expect(exists(activeStep)).resolves.toBe(true)
    })

    it('evicts only the least-active step in a flow version, leaving its active steps and the flow-version dir intact', async () => {
        const basePath = uniqueBasePath()
        const flowVersionId = apId()
        const coldStep = await seedStepDir({ basePath, flowVersionId, stepName: 'cold_step', ageMs: 3 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const hotStep = await seedStepDir({ basePath, flowVersionId, stepName: 'hot_step', ageMs: 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(1) })

        await expect(exists(coldStep)).resolves.toBe(false)
        await expect(exists(hotStep)).resolves.toBe(true)
        await expect(exists(flowVersionDir({ basePath, flowVersionId }))).resolves.toBe(true)
    })

    it('never touches the action-runs namespace, which already manages its own eviction', async () => {
        const basePath = uniqueBasePath()
        const actionRunNamespace = actionRunCache.namespace({ platformId: apId(), sourceHash: 'f'.repeat(64) })
        const actionRunStep = await seedStepDir({
            basePath,
            flowVersionId: actionRunNamespace,
            ageMs: 90 * 24 * 60 * 60 * 1000,
        })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(10) })

        await expect(exists(actionRunStep)).resolves.toBe(true)
    })

    it('does nothing when the code cache directory does not exist yet', async () => {
        const basePath = uniqueBasePath()

        await expect(codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(10) }))
            .resolves.toBeUndefined()
    })

    it('clears a removed directory from pendingCacheRemovals once eviction finishes, so provisioning is never left waiting forever', async () => {
        const basePath = uniqueBasePath()
        const stepPath = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(1) })

        await expect(exists(stepPath)).resolves.toBe(false)
        await expect(pendingCacheRemovals.settle(stepPath)).resolves.toBe(false)
    })

    it('by default reads disk usage from basePath itself (statfs), not a hardcoded path — a nonexistent basePath is treated as 0% used rather than falling back to "/"', async () => {
        const basePath = join(tmpdir(), `code-cache-eviction-test-missing-${randomUUID()}`)

        await expect(codeCacheEviction.sweep({ basePath, log: noopLog })).resolves.toBeUndefined()
    })
})

type SeedParams = {
    basePath: string
    flowVersionId: string
    stepName?: string
    ageMs: number
}
