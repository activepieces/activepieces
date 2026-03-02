import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSandboxPool } from '../src/lib/sandbox-pool'
import { Sandbox, SandboxFactory, SandboxLogger } from '../src/lib/types'

function createMockLogger(): SandboxLogger {
    return {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}

function createMockSandbox(id: string): Sandbox {
    return {
        id,
        start: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockResolvedValue(undefined),
        shutdown: vi.fn().mockResolvedValue(undefined),
    }
}

describe('createSandboxPool', () => {
    let log: SandboxLogger
    let factory: SandboxFactory
    let generation: number

    beforeEach(() => {
        log = createMockLogger()
        generation = 0
        factory = vi.fn().mockImplementation((_log: SandboxLogger, sandboxId: string) => {
            return createMockSandbox(sandboxId)
        })
    })

    it('should allocate a sandbox from the queue', async () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 2, reusable: false, getGeneration: () => generation })

        const sandbox = await pool.allocate(log)
        expect(sandbox).toBeDefined()
        expect(sandbox.id).toBeDefined()
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('should throw when no sandbox is available', async () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 1, reusable: false, getGeneration: () => generation })

        await pool.allocate(log)
        await expect(pool.allocate(log)).rejects.toThrow('No sandbox available')
    })

    it('should reuse existing sandbox when generation is current', async () => {
        generation = 1
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 1, reusable: true, getGeneration: () => generation })

        const sandbox1 = await pool.allocate(log)
        await pool.release(sandbox1, log)

        const sandbox2 = await pool.allocate(log)
        expect(sandbox2.id).toBe(sandbox1.id)
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('should restart sandbox when generation is stale', async () => {
        generation = 1
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 1, reusable: true, getGeneration: () => generation })

        const sandbox1 = await pool.allocate(log)
        await pool.release(sandbox1, log)

        generation = 2
        const sandbox2 = await pool.allocate(log)
        expect(sandbox1.shutdown).toHaveBeenCalled()
        expect(sandbox2.id).toBe(sandbox1.id)
        expect(factory).toHaveBeenCalledTimes(2)
    })

    it('should release non-reusable sandbox by shutting it down', async () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 1, reusable: false, getGeneration: () => generation })

        const sandbox = await pool.allocate(log)
        await pool.release(sandbox, log)
        expect(sandbox.shutdown).toHaveBeenCalled()
    })

    it('should release reusable sandbox without shutting it down', async () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 1, reusable: true, getGeneration: () => generation })

        const sandbox = await pool.allocate(log)
        await pool.release(sandbox, log)
        expect(sandbox.shutdown).not.toHaveBeenCalled()
    })

    it('should handle release of undefined sandbox', async () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 1, reusable: false, getGeneration: () => generation })

        await pool.release(undefined, log)
    })

    it('should drain all sandboxes', async () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 2, reusable: true, getGeneration: () => generation })

        const sandbox1 = await pool.allocate(log)
        await pool.release(sandbox1, log)
        const sandbox2 = await pool.allocate(log)
        await pool.release(sandbox2, log)

        await pool.drain()

        expect(sandbox1.shutdown).toHaveBeenCalled()
        expect(sandbox2.shutdown).toHaveBeenCalled()
    })

    it('should report correct total and free sandbox counts', () => {
        const pool = createSandboxPool(factory)
        pool.init(log, { concurrency: 3, reusable: false, getGeneration: () => generation })

        expect(pool.getFreeSandboxes()).toBe(3)
        expect(pool.getTotalSandboxes()).toBe(0)
    })
})
