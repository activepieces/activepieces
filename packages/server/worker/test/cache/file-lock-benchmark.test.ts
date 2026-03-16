import { mkdir, rm, writeFile, readFile } from 'node:fs/promises'
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

describe('withFileLock — benchmarks', () => {
    let testDir: string

    beforeEach(async () => {
        testDir = join(tmpdir(), `file-lock-bench-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(testDir, { recursive: true })
    })

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true })
    })

    it('benchmark: uncontended lock acquire/release overhead (100 iterations)', async () => {
        const lockPath = join(testDir, 'uncontended')

        const start = performance.now()
        for (let i = 0; i < 100; i++) {
            await withFileLock(lockPath, async () => {
                // Minimal work — just measure lock overhead
            })
        }
        const elapsed = performance.now() - start
        const perOp = elapsed / 100

        console.log(`[BENCH] Uncontended lock: ${elapsed.toFixed(1)}ms total, ${perOp.toFixed(2)}ms/op (100 iterations)`)
        // Sanity: each lock/unlock should be under 20ms on any reasonable system
        expect(perOp).toBeLessThan(20)
    }, 30_000)

    it('benchmark: 10 concurrent callers with minimal work', async () => {
        const lockPath = join(testDir, 'concurrent-10')

        const start = performance.now()
        const tasks = Array.from({ length: 10 }, () =>
            withFileLock(lockPath, async () => {
                // Minimal work
            }),
        )
        await Promise.all(tasks)
        const elapsed = performance.now() - start

        console.log(`[BENCH] 10 concurrent (minimal work): ${elapsed.toFixed(1)}ms total`)
        // Should complete in reasonable time
        expect(elapsed).toBeLessThan(10_000)
    }, 15_000)

    it('benchmark: 10 concurrent callers with 10ms work each', async () => {
        const lockPath = join(testDir, 'concurrent-10-work')

        const start = performance.now()
        const tasks = Array.from({ length: 10 }, () =>
            withFileLock(lockPath, async () => {
                await new Promise((r) => setTimeout(r, 10))
            }),
        )
        await Promise.all(tasks)
        const elapsed = performance.now() - start
        // Theoretical minimum is 10 * 10ms = 100ms (serial), plus lock overhead
        const overhead = elapsed - 100

        console.log(`[BENCH] 10 concurrent (10ms work): ${elapsed.toFixed(1)}ms total, ~${overhead.toFixed(1)}ms overhead`)
        // Overhead should be reasonable
        expect(elapsed).toBeLessThan(5_000)
    }, 15_000)

    it('benchmark: counter increment — locked vs unlocked correctness', async () => {
        const N = 50
        const filePath = join(testDir, 'counter.txt')

        // UNLOCKED: demonstrate the race condition
        await writeFile(filePath, '0')
        const unlockedStart = performance.now()
        const unlockedTasks = Array.from({ length: N }, async () => {
            const raw = await readFile(filePath, 'utf8')
            const val = parseInt(raw, 10)
            await new Promise((r) => setTimeout(r, 1))
            await writeFile(filePath, String(val + 1))
        })
        await Promise.all(unlockedTasks)
        const unlockedElapsed = performance.now() - unlockedStart
        const unlockedResult = parseInt(await readFile(filePath, 'utf8'), 10)

        // LOCKED: demonstrate correctness
        const lockPath = join(testDir, 'locked-counter')
        await writeFile(filePath, '0')
        const lockedStart = performance.now()
        const lockedTasks = Array.from({ length: N }, () =>
            withFileLock(lockPath, async () => {
                const raw = await readFile(filePath, 'utf8')
                const val = parseInt(raw, 10)
                await new Promise((r) => setTimeout(r, 1))
                await writeFile(filePath, String(val + 1))
            }),
        )
        await Promise.all(lockedTasks)
        const lockedElapsed = performance.now() - lockedStart
        const lockedResult = parseInt(await readFile(filePath, 'utf8'), 10)

        console.log(`[BENCH] Counter (N=${N}):`)
        console.log(`  Unlocked: ${unlockedElapsed.toFixed(1)}ms, result=${unlockedResult} (expected ${N}, likely WRONG)`)
        console.log(`  Locked:   ${lockedElapsed.toFixed(1)}ms, result=${lockedResult} (expected ${N}, CORRECT)`)

        // Unlocked will likely be wrong (race condition) — we don't assert on it
        // Locked must be correct
        expect(lockedResult).toBe(N)
    }, 60_000)

    it('benchmark: 5 independent locks in parallel vs 1 shared lock', async () => {
        const N = 5
        const WORK_MS = 20

        // 5 independent locks (should run in parallel)
        const independentStart = performance.now()
        const independentTasks = Array.from({ length: N }, (_, i) =>
            withFileLock(join(testDir, `independent-${i}`), async () => {
                await new Promise((r) => setTimeout(r, WORK_MS))
            }),
        )
        await Promise.all(independentTasks)
        const independentElapsed = performance.now() - independentStart

        // 1 shared lock (must run serially)
        const sharedStart = performance.now()
        const sharedTasks = Array.from({ length: N }, () =>
            withFileLock(join(testDir, 'shared-single'), async () => {
                await new Promise((r) => setTimeout(r, WORK_MS))
            }),
        )
        await Promise.all(sharedTasks)
        const sharedElapsed = performance.now() - sharedStart

        console.log(`[BENCH] ${N} tasks x ${WORK_MS}ms work:`)
        console.log(`  Independent locks (parallel): ${independentElapsed.toFixed(1)}ms`)
        console.log(`  Shared lock (serial):         ${sharedElapsed.toFixed(1)}ms`)
        console.log(`  Speedup:                      ${(sharedElapsed / independentElapsed).toFixed(1)}x`)

        // Independent should be significantly faster (close to WORK_MS, not N*WORK_MS)
        expect(independentElapsed).toBeLessThan(sharedElapsed)
    }, 15_000)
})
