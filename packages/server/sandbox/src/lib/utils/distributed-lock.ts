import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, rm, stat, utimes } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { ApLock } from '@activepieces/server-utils'

const INITIAL_POLL_INTERVAL_MS = 25
const MAX_POLL_INTERVAL_MS = 500
const STALE_LOCK_MS = 5 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 60 * 1000

export const diskLock = (locksPath: string) => ({
    acquire: async (key: string, timeoutMs?: number): Promise<ApLock> => {
        const lockPath = join(locksPath, `${sanitizeKey(key)}.lock`)
        const token = randomUUID()
        const deadline = isNil(timeoutMs) ? null : Date.now() + timeoutMs
        await mkdir(locksPath, { recursive: true })
        let retriedAfterTakeover = false
        let pollIntervalMs = INITIAL_POLL_INTERVAL_MS
        while (!await tryAcquireOnce({ lockPath, token })) {
            const tookOver = await takeoverIfStale(lockPath)
            if (tookOver && !retriedAfterTakeover && (isNil(deadline) || Date.now() < deadline)) {
                retriedAfterTakeover = true
                continue
            }
            if (!isNil(deadline) && Date.now() >= deadline) {
                throw new DiskLockTimeoutError(key)
            }
            await sleep(pollIntervalMs)
            pollIntervalMs = Math.min(pollIntervalMs * 2, MAX_POLL_INTERVAL_MS)
        }
        const heartbeat = setInterval(() => {
            const now = new Date()
            utimes(lockPath, now, now).catch(() => undefined)
        }, HEARTBEAT_INTERVAL_MS)
        heartbeat.unref()
        return {
            release: async () => {
                clearInterval(heartbeat)
                await releaseIfOwned({ lockPath, token })
            },
        }
    },
    runExclusive: async <T>({ key, fn, timeoutMs }: RunExclusiveParams<T>): Promise<T> => {
        const lock = await diskLock(locksPath).acquire(key, timeoutMs)
        try {
            return await fn()
        }
        finally {
            await lock.release()
        }
    },
})

export class DiskLockTimeoutError extends Error {
    constructor(key: string) {
        super(`Timed out acquiring disk lock for key ${key}`)
    }
}

function sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9._-]/g, '-')
}

async function tryAcquireOnce({ lockPath, token }: LockParams): Promise<boolean> {
    const { data: handle, error } = await tryCatch(() => open(lockPath, 'wx'))
    if (error) {
        if (getErrorCode(error) === 'EEXIST') {
            return false
        }
        throw error
    }
    try {
        await handle.writeFile(token, 'utf8')
    }
    finally {
        await handle.close()
    }
    return true
}

async function takeoverIfStale(lockPath: string): Promise<boolean> {
    const { data: lockStat, error } = await tryCatch(() => stat(lockPath))
    if (error || Date.now() - lockStat.mtimeMs < STALE_LOCK_MS) {
        return false
    }
    const stalePath = `${lockPath}.stale-${randomUUID()}`
    const { error: renameError } = await tryCatch(() => rename(lockPath, stalePath))
    if (renameError) {
        return false
    }
    await rm(stalePath, { force: true })
    return true
}

async function releaseIfOwned({ lockPath, token }: LockParams): Promise<void> {
    const { data: owner, error } = await tryCatch(() => readFile(lockPath, 'utf8'))
    if (error || owner !== token) {
        return
    }
    await rm(lockPath, { force: true })
}

function getErrorCode(error: unknown): string | undefined {
    if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
        return error.code
    }
    return undefined
}

type LockParams = {
    lockPath: string
    token: string
}

type RunExclusiveParams<T> = {
    key: string
    fn: () => Promise<T>
    timeoutMs?: number
}
