import { mkdir, rm, stat, utimes, writeFile, readFile } from 'node:fs/promises'
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

describe('withFileLock — stress tests', () => {
    let testDir: string

    beforeEach(async () => {
        testDir = join(tmpdir(), `file-lock-stress-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(testDir, { recursive: true })
    })

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true })
    })

    it('10 concurrent callers on same lock: all execute exactly once, sequentially', async () => {
        const lockPath = join(testDir, 'shared')
        const counter = { value: 0, maxConcurrent: 0, currentConcurrent: 0 }

        const tasks = Array.from({ length: 10 }, (_, i) =>
            withFileLock(lockPath, async () => {
                counter.currentConcurrent++
                counter.maxConcurrent = Math.max(counter.maxConcurrent, counter.currentConcurrent)
                counter.value++
                // Simulate work
                await new Promise((r) => setTimeout(r, 20))
                counter.currentConcurrent--
                return i
            }),
        )

        const results = await Promise.all(tasks)

        expect(counter.value).toBe(10)
        // At most 1 should run concurrently (mutual exclusion)
        expect(counter.maxConcurrent).toBe(1)
        // All should return their index
        expect(results.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    }, 30_000)

    it('20 concurrent callers on same lock: counter is never corrupted', async () => {
        const lockPath = join(testDir, 'counter')
        const filePath = join(testDir, 'count.txt')
        await writeFile(filePath, '0')

        const tasks = Array.from({ length: 20 }, () =>
            withFileLock(lockPath, async () => {
                const raw = await readFile(filePath, 'utf8')
                const current = parseInt(raw, 10)
                // Simulate a small delay to expose race conditions
                await new Promise((r) => setTimeout(r, 5))
                await writeFile(filePath, String(current + 1))
            }),
        )

        await Promise.all(tasks)

        const final = await readFile(filePath, 'utf8')
        expect(parseInt(final, 10)).toBe(20)
    }, 30_000)

    it('50 concurrent callers: file counter integrity under heavy contention', async () => {
        const lockPath = join(testDir, 'heavy')
        const filePath = join(testDir, 'heavy-count.txt')
        await writeFile(filePath, '0')

        const N = 50
        const tasks = Array.from({ length: N }, () =>
            withFileLock(lockPath, async () => {
                const raw = await readFile(filePath, 'utf8')
                const current = parseInt(raw, 10)
                await writeFile(filePath, String(current + 1))
            }),
        )

        await Promise.all(tasks)

        const final = await readFile(filePath, 'utf8')
        expect(parseInt(final, 10)).toBe(N)
    }, 60_000)

    it('concurrent callers on 5 different locks: all 5 groups run independently', async () => {
        const N_LOCKS = 5
        const N_PER_LOCK = 10
        const counters = Array.from({ length: N_LOCKS }, () => ({ value: 0, maxConcurrent: 0, currentConcurrent: 0 }))

        const tasks: Promise<void>[] = []
        for (let lockIdx = 0; lockIdx < N_LOCKS; lockIdx++) {
            const lockPath = join(testDir, `lock-${lockIdx}`)
            for (let j = 0; j < N_PER_LOCK; j++) {
                tasks.push(
                    withFileLock(lockPath, async () => {
                        counters[lockIdx].currentConcurrent++
                        counters[lockIdx].maxConcurrent = Math.max(
                            counters[lockIdx].maxConcurrent,
                            counters[lockIdx].currentConcurrent,
                        )
                        counters[lockIdx].value++
                        await new Promise((r) => setTimeout(r, 10))
                        counters[lockIdx].currentConcurrent--
                    }),
                )
            }
        }

        await Promise.all(tasks)

        for (let i = 0; i < N_LOCKS; i++) {
            expect(counters[i].value).toBe(N_PER_LOCK)
            expect(counters[i].maxConcurrent).toBe(1)
        }
    }, 30_000)

    it('error in one caller does not block subsequent callers', async () => {
        const lockPath = join(testDir, 'error-recovery')
        const results: string[] = []

        // First caller throws
        const p1 = withFileLock(lockPath, async () => {
            results.push('start-1')
            throw new Error('intentional')
        }).catch((e) => {
            results.push(`error-1:${e.message}`)
        })

        // Give p1 time to acquire and throw
        await new Promise((r) => setTimeout(r, 50))

        // Second caller should still be able to acquire
        const p2 = withFileLock(lockPath, async () => {
            results.push('success-2')
            return 'done'
        })

        await Promise.all([p1, p2])

        expect(results).toContain('start-1')
        expect(results).toContain('error-1:intentional')
        expect(results).toContain('success-2')
    }, 10_000)

    it('multiple errors do not leak locks', async () => {
        const lockPath = join(testDir, 'multi-error')
        const N = 10

        // All callers throw
        const tasks = Array.from({ length: N }, (_, i) =>
            withFileLock(lockPath, async () => {
                throw new Error(`error-${i}`)
            }).catch(() => `caught-${i}`),
        )

        const results = await Promise.all(tasks)
        expect(results).toHaveLength(N)

        // Lock should be fully released — we can acquire it immediately
        const final = await withFileLock(lockPath, async () => 'clean')
        expect(final).toBe('clean')
    }, 30_000)

    it('stale lock from a crashed process is broken and re-acquired', async () => {
        const lockPath = join(testDir, 'stale-recovery')
        const lockDir = lockPath + '.lock'

        // Simulate a crashed process that left a stale lock
        await mkdir(lockDir, { recursive: false })
        const pastTime = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        await utimes(lockDir, pastTime, pastTime)

        // Should break stale lock and succeed
        const result = await withFileLock(lockPath, async () => 'recovered')
        expect(result).toBe('recovered')

        // Lock should be released
        await expect(stat(lockDir)).rejects.toThrow()
    }, 10_000)

    it('lock contention: waiter acquires after holder finishes long task', async () => {
        const lockPath = join(testDir, 'contention')
        const timeline: Array<{ event: string, time: number }> = []
        const start = Date.now()

        const p1 = withFileLock(lockPath, async () => {
            timeline.push({ event: 'holder-start', time: Date.now() - start })
            await new Promise((r) => setTimeout(r, 500))
            timeline.push({ event: 'holder-end', time: Date.now() - start })
        })

        // Start waiter shortly after holder
        await new Promise((r) => setTimeout(r, 50))

        const p2 = withFileLock(lockPath, async () => {
            timeline.push({ event: 'waiter-start', time: Date.now() - start })
        })

        await Promise.all([p1, p2])

        // Verify ordering: holder starts, holder ends, then waiter starts
        expect(timeline[0].event).toBe('holder-start')
        expect(timeline[1].event).toBe('holder-end')
        expect(timeline[2].event).toBe('waiter-start')
        // Waiter should start after holder ends (with some tolerance)
        expect(timeline[2].time).toBeGreaterThanOrEqual(timeline[1].time)
    }, 10_000)

    it('rapid lock/unlock cycles do not corrupt state', async () => {
        const lockPath = join(testDir, 'rapid')
        const N = 100
        let counter = 0

        // Sequentially lock/unlock very quickly
        for (let i = 0; i < N; i++) {
            await withFileLock(lockPath, async () => {
                counter++
            })
        }

        expect(counter).toBe(N)

        // Lock should be cleanly released
        await expect(stat(lockPath + '.lock')).rejects.toThrow()
    }, 30_000)

    it('mixed fast and slow callers maintain mutual exclusion', async () => {
        const lockPath = join(testDir, 'mixed')
        const order: number[] = []
        let concurrent = 0
        let maxConcurrent = 0

        const tasks = Array.from({ length: 15 }, (_, i) =>
            withFileLock(lockPath, async () => {
                concurrent++
                maxConcurrent = Math.max(maxConcurrent, concurrent)
                order.push(i)
                // Alternate between fast and slow
                const delay = i % 3 === 0 ? 50 : 5
                await new Promise((r) => setTimeout(r, delay))
                concurrent--
            }),
        )

        await Promise.all(tasks)

        expect(order).toHaveLength(15)
        expect(maxConcurrent).toBe(1)
    }, 30_000)
})
