import { mkdir, rm, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import { logger } from '../config/logger'

const STALE_LOCK_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes
const RETRY_INTERVAL_MS = 100
const MAX_WAIT_MS = 5 * 60 * 1000 // 5 minutes

async function ensureParentDir(lockDir: string): Promise<void> {
    await mkdir(dirname(lockDir), { recursive: true })
}

async function acquireLock(lockDir: string): Promise<boolean> {
    try {
        await ensureParentDir(lockDir)
        await mkdir(lockDir, { recursive: false })
        return true
    }
    catch (err: unknown) {
        const error = err as NodeJS.ErrnoException
        if (error.code === 'EEXIST') {
            return false
        }
        throw err
    }
}

async function isLockStale(lockDir: string): Promise<boolean> {
    try {
        const stats = await stat(lockDir)
        return Date.now() - stats.mtimeMs > STALE_LOCK_THRESHOLD_MS
    }
    catch {
        return true
    }
}

async function breakStaleLock(lockDir: string): Promise<void> {
    try {
        await rm(lockDir, { recursive: true })
    }
    catch {
        // Lock was already removed by another process
    }
}

async function releaseLock(lockDir: string): Promise<void> {
    try {
        await rm(lockDir, { recursive: true })
    }
    catch {
        // Best effort — lock dir may already be gone
    }
}

export async function withFileLock<T>(lockPath: string, fn: () => Promise<T>): Promise<T> {
    const lockDir = lockPath + '.lock'
    const startTime = Date.now()

    while (true) {
        const acquired = await acquireLock(lockDir)
        if (acquired) {
            break
        }

        if (await isLockStale(lockDir)) {
            logger.warn({ lockDir }, 'Breaking stale file lock')
            await breakStaleLock(lockDir)
            continue
        }

        if (Date.now() - startTime > MAX_WAIT_MS) {
            logger.warn({ lockDir }, 'File lock wait timeout exceeded, breaking lock')
            await breakStaleLock(lockDir)
            continue
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS))
    }

    try {
        return await fn()
    }
    finally {
        await releaseLock(lockDir)
    }
}
