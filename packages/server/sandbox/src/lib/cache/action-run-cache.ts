import { readdir, rm, stat, utimes } from 'node:fs/promises'
import path from 'node:path'
import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { cacheUtils } from './cache-paths'

export const actionRunCache = {
    namespace({ platformId, sourceHash }: NamespaceParams): string {
        if (platformId.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Cannot namespace an action-run code cache without a platformId' },
            })
        }
        return `${MANAGED_PREFIX}${platformId}_${sourceHash}`
    },

    isManagedDir(dirName: string): boolean {
        return dirName.startsWith(MANAGED_PREFIX)
    },

    isOrphanedDir(dirName: string): boolean {
        return dirName === LEGACY_CONSTANT_NAMESPACE || BARE_SHA256.test(dirName)
    },

    async touch(dirPath: string): Promise<void> {
        const now = new Date()
        await tryCatch(() => utimes(dirPath, now, now))
    },

    async sweep({ basePath, log }: SweepParams): Promise<void> {
        const startedAt = Date.now()
        const codesPath = cacheUtils(basePath).getGlobalCodeCachePath()
        const { data: entries, error } = await tryCatch(() => readdir(codesPath, { withFileTypes: true }))
        if (error) {
            return
        }

        const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
        const orphans = names.filter((name) => actionRunCache.isOrphanedDir(name))
        const managed = names.filter((name) => actionRunCache.isManagedDir(name))

        let reclaimedCount = 0
        let reclaimedBytes = 0

        for (const name of orphans) {
            const removed = await removeDir({ dirPath: path.join(codesPath, name) })
            reclaimedCount += removed.removed ? 1 : 0
            reclaimedBytes += removed.bytes
        }

        const expiredAt = Date.now() - AR_CACHE_TTL_MS
        const survivors: DirEntry[] = []
        for (const name of managed) {
            const dirPath = path.join(codesPath, name)
            const mtimeMs = await readMtimeMs(dirPath)
            if (isNil(mtimeMs)) {
                continue
            }
            if (mtimeMs < expiredAt) {
                const removed = await removeDir({ dirPath, expectedMtimeMs: mtimeMs })
                reclaimedCount += removed.removed ? 1 : 0
                reclaimedBytes += removed.bytes
                continue
            }
            survivors.push({ dirPath, mtimeMs, bytes: await dirSizeBytes(dirPath) })
        }

        let totalBytes = survivors.reduce((sum, entry) => sum + entry.bytes, 0)
        const oldestFirst = [...survivors].sort((a, b) => a.mtimeMs - b.mtimeMs)
        for (const entry of oldestFirst) {
            if (totalBytes <= AR_CACHE_MAX_BYTES) {
                break
            }
            const removed = await removeDir({ dirPath: entry.dirPath, expectedMtimeMs: entry.mtimeMs })
            if (!removed.removed) {
                continue
            }
            totalBytes -= entry.bytes
            reclaimedCount += 1
            reclaimedBytes += removed.bytes
        }

        if (reclaimedCount === 0) {
            return
        }
        log.info({
            reclaimedCount,
            reclaimedBytes,
            retainedCount: survivors.length,
            retainedBytes: totalBytes,
            durationMs: Date.now() - startedAt,
        }, 'Swept action-run code cache')
    },
}

async function readMtimeMs(dirPath: string): Promise<number | null> {
    const { data: stats, error } = await tryCatch(() => stat(dirPath))
    if (error) {
        return null
    }
    return stats.mtimeMs
}

async function removeDir({ dirPath, expectedMtimeMs }: RemoveDirParams): Promise<RemoveDirResult> {
    if (!isNil(expectedMtimeMs)) {
        const currentMtimeMs = await readMtimeMs(dirPath)
        if (isNil(currentMtimeMs) || currentMtimeMs !== expectedMtimeMs) {
            return { removed: false, bytes: 0 }
        }
    }
    const bytes = await dirSizeBytes(dirPath)
    const { error } = await tryCatch(() => rm(dirPath, { recursive: true, force: true }))
    if (error) {
        return { removed: false, bytes: 0 }
    }
    return { removed: true, bytes }
}

async function dirSizeBytes(dirPath: string): Promise<number> {
    const { data: entries, error } = await tryCatch(() => readdir(dirPath, { withFileTypes: true }))
    if (error) {
        return 0
    }
    const sizes = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
            return dirSizeBytes(entryPath)
        }
        const { data: stats, error: statError } = await tryCatch(() => stat(entryPath))
        return statError ? 0 : stats.size
    }))
    return sizes.reduce((sum, size) => sum + size, 0)
}

const MANAGED_PREFIX = 'ar_'
const LEGACY_CONSTANT_NAMESPACE = 'mcp-flow-version-id'
const BARE_SHA256 = /^[0-9a-f]{64}$/

const AR_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const AR_CACHE_MAX_BYTES = 2 * 1024 * 1024 * 1024

export const ACTION_RUN_CACHE_SWEEP_INTERVAL_MS = 30 * 60 * 1000
export const ACTION_RUN_CACHE_FIRST_SWEEP_DELAY_MS = 60 * 1000

type NamespaceParams = {
    platformId: string
    sourceHash: string
}

type SweepParams = {
    basePath: string
    log: ApLogger
}

type DirEntry = {
    dirPath: string
    mtimeMs: number
    bytes: number
}

type RemoveDirParams = {
    dirPath: string
    expectedMtimeMs?: number
}

type RemoveDirResult = {
    removed: boolean
    bytes: number
}
