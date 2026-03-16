import { mkdir, rm, stat, utimes } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'

vi.mock('../../src/lib/config/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}))

import { withFileLock } from '../../src/lib/cache/file-lock'

describe('withFileLock', () => {
    let testDir: string

    beforeEach(async () => {
        testDir = join(tmpdir(), `file-lock-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(testDir, { recursive: true })
    })

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true })
    })

    it('should execute the function and return its result', async () => {
        const lockPath = join(testDir, 'test')
        const result = await withFileLock(lockPath, async () => 42)
        expect(result).toBe(42)
    })

    it('should release lock after execution', async () => {
        const lockPath = join(testDir, 'test')
        await withFileLock(lockPath, async () => 'done')

        // Lock dir should not exist after release
        await expect(stat(lockPath + '.lock')).rejects.toThrow()
    })

    it('should release lock even if function throws', async () => {
        const lockPath = join(testDir, 'test')
        const error = new Error('test error')

        await expect(withFileLock(lockPath, async () => {
            throw error
        })).rejects.toThrow('test error')

        // Lock dir should not exist after error
        await expect(stat(lockPath + '.lock')).rejects.toThrow()
    })

    it('should serialize concurrent calls on the same path', async () => {
        const lockPath = join(testDir, 'test')
        const order: number[] = []

        const p1 = withFileLock(lockPath, async () => {
            order.push(1)
            await new Promise((r) => setTimeout(r, 200))
            order.push(2)
        })

        // Give p1 time to acquire the lock
        await new Promise((r) => setTimeout(r, 50))

        const p2 = withFileLock(lockPath, async () => {
            order.push(3)
        })

        await Promise.all([p1, p2])

        // p1 should complete (1,2) before p2 starts (3)
        expect(order).toEqual([1, 2, 3])
    })

    it('should allow concurrent calls on different paths', async () => {
        const lockPath1 = join(testDir, 'test1')
        const lockPath2 = join(testDir, 'test2')
        const running: boolean[] = []

        const p1 = withFileLock(lockPath1, async () => {
            running.push(true)
            await new Promise((r) => setTimeout(r, 200))
            return running.length
        })

        // Give p1 a head start
        await new Promise((r) => setTimeout(r, 50))

        const p2 = withFileLock(lockPath2, async () => {
            running.push(true)
            return running.length
        })

        const [r1, r2] = await Promise.all([p1, p2])
        // Both should have been running (p2 doesn't wait for p1)
        expect(running.length).toBe(2)
        // p2 should have started while p1 was still sleeping
        expect(r2).toBeLessThanOrEqual(r1)
    })

    it('should break stale locks and re-acquire', async () => {
        const lockPath = join(testDir, 'test')
        const lockDir = lockPath + '.lock'

        // Create a "stale" lock manually and backdate its mtime
        await mkdir(lockDir, { recursive: false })
        const pastTime = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        await utimes(lockDir, pastTime, pastTime)

        const result = await Promise.race([
            withFileLock(lockPath, async () => 'acquired'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ])

        expect(result).toBe('acquired')
    })
})
