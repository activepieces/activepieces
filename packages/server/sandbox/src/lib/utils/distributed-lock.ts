import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { ApLock } from '@activepieces/server-utils'

const POLL_INTERVAL_MS = 500
const STALE_LOCK_MS = 5 * 60 * 1000

export const diskLock = (locksPath: string) => ({
    acquire: async (key: string, timeoutMs?: number): Promise<ApLock> => {
        const lockPath = join(locksPath, `${sanitizeKey(key)}.lock`)
        const token = randomUUID()
        const deadline = isNil(timeoutMs) ? null : Date.now() + timeoutMs
        await mkdir(locksPath, { recursive: true })
        while (!await tryAcquireOnce({ lockPath, token })) {
            await takeoverIfStale(lockPath)
            if (!isNil(deadline) && Date.now() >= deadline) {
                throw new Error(`Timed out acquiring disk lock for key ${key}`)
            }
            await sleep(POLL_INTERVAL_MS)
        }
        return {
            release: async () => releaseIfOwned({ lockPath, token }),
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

async function takeoverIfStale(lockPath: string): Promise<void> {
    const { data: lockStat, error } = await tryCatch(() => stat(lockPath))
    if (error || Date.now() - lockStat.mtimeMs < STALE_LOCK_MS) {
        return
    }
    const stalePath = `${lockPath}.stale-${randomUUID()}`
    const { error: renameError } = await tryCatch(() => rename(lockPath, stalePath))
    if (renameError) {
        return
    }
    await rm(stalePath, { force: true })
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
