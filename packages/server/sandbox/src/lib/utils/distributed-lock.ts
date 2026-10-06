import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import writeFileAtomic from 'write-file-atomic'

const POLL_INTERVAL_MS = 500
const DEFAULT_STALE_MS = 5 * 60 * 1000
const DONE_MARKER = 'done'

export const distributedDiskLock = (locksPath: string) => ({
    async runExclusiveWithCooldown({ key, fn, timeoutMs, cooldownMs, staleMs = DEFAULT_STALE_MS }: RunExclusiveParams): Promise<boolean> {
        const lockPath = join(locksPath, `${sanitizeKey(key)}.lock`)
        const token = randomUUID()
        const deadline = Date.now() + timeoutMs
        await mkdir(locksPath, { recursive: true })
        for (;;) {
            if (await tryAcquire({ lockPath, token })) {
                try {
                    await fn()
                }
                finally {
                    await markDoneIfOwned({ lockPath, token })
                }
                return true
            }
            const state = await readLockState(lockPath)
            if (!isNil(state)) {
                const isDone = state.content === DONE_MARKER
                if (isDone && state.ageMs < cooldownMs) {
                    return false
                }
                if (state.ageMs >= (isDone ? cooldownMs : staleMs)) {
                    await takeover(lockPath)
                    continue
                }
            }
            if (Date.now() >= deadline) {
                throw new Error(`Timed out waiting for disk lock ${key}`)
            }
            await sleep(POLL_INTERVAL_MS)
        }
    },
})

function sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9._-]/g, '-')
}

async function tryAcquire({ lockPath, token }: LockParams): Promise<boolean> {
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

async function readLockState(lockPath: string): Promise<{ content: string, ageMs: number } | null> {
    const { data: lockStat, error: statError } = await tryCatch(() => stat(lockPath))
    if (statError) {
        return null
    }
    const { data: content, error: readError } = await tryCatch(() => readFile(lockPath, 'utf8'))
    if (readError) {
        return null
    }
    return { content, ageMs: Date.now() - lockStat.mtimeMs }
}

async function takeover(lockPath: string): Promise<void> {
    const stalePath = `${lockPath}.stale-${randomUUID()}`
    const { error } = await tryCatch(() => rename(lockPath, stalePath))
    if (error) {
        return
    }
    await rm(stalePath, { force: true })
}

async function markDoneIfOwned({ lockPath, token }: LockParams): Promise<void> {
    const { data: owner, error } = await tryCatch(() => readFile(lockPath, 'utf8'))
    if (error || owner !== token) {
        return
    }
    await tryCatch(() => writeFileAtomic(lockPath, DONE_MARKER, 'utf8'))
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

type RunExclusiveParams = {
    key: string
    fn: () => Promise<void>
    timeoutMs: number
    cooldownMs: number
    staleMs?: number
}
