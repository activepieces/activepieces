import { describe, it, expect, vi } from 'vitest'

// Inlined in the mock factory below too — vi.mock is hoisted above const initialization.
const TWO_GB_IN_BYTES = 2 * 1024 * 1024 * 1024

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...actual,
        systemUsage: {
            ...actual.systemUsage,
            getContainerMemoryUsage: vi.fn().mockResolvedValue({ totalRamInBytes: 2 * 1024 * 1024 * 1024, ramUsage: 10 }),
        },
    }
})

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ SANDBOX_MEMORY_LIMIT: '1048576' }),
    },
}))

vi.mock('../../src/lib/config/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { sandboxConfig } from '../../src/lib/runtime/sandbox-config'

// Order matters: the module holds the primed value, so the un-primed assertion runs first.
describe('sandboxConfig memory limit', () => {
    it('uses the server-provided limit before priming', () => {
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('uses the full container memory after priming (concurrency 1)', async () => {
        await sandboxConfig.primeFullContainerMemory()
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe(String(TWO_GB_IN_BYTES / 1024))
    })
})
