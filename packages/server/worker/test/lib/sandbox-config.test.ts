import { describe, it, expect, vi } from 'vitest'

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

import { systemUsage } from '@activepieces/server-utils'
import { sandboxConfig } from '../../src/lib/runtime/sandbox-config'

const getContainerMemoryUsageMock = vi.mocked(systemUsage.getContainerMemoryUsage)

// Order matters: the module holds the primed value, so the un-primed assertion runs first.
describe('sandboxConfig memory limit', () => {
    it('uses the server-provided limit before priming', () => {
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('reserves 15% headroom below container memory after priming (concurrency 1)', async () => {
        // 2GB → 2097152 KB; headroom = max(256MB, 15%) = floor(2097152 * 0.15) = 314572 KB.
        await sandboxConfig.primeFullContainerMemory()
        const totalKb = TWO_GB_IN_BYTES / 1024
        const headroomKb = Math.floor(totalKb * 0.15)
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe(String(totalKb - headroomKb))
    })

    it('reserves a 256MB minimum headroom on small containers', async () => {
        // 1GB → 1048576 KB; 15% = 157286 KB < 256MB floor (262144 KB), so 256MB is withheld.
        getContainerMemoryUsageMock.mockResolvedValueOnce({ totalRamInBytes: 1024 * 1024 * 1024, ramUsage: 10 })
        await sandboxConfig.primeFullContainerMemory()
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe(String(1048576 - 262144))
    })

    it('never drops below the 256MB sandbox floor when headroom would exceed total', async () => {
        // 256MB container → headroom (256MB) == total, so the result clamps to the 256MB floor.
        getContainerMemoryUsageMock.mockResolvedValueOnce({ totalRamInBytes: 256 * 1024 * 1024, ramUsage: 10 })
        await sandboxConfig.primeFullContainerMemory()
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe(String(256 * 1024))
    })
})
