import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSettings = vi.fn()
const getContainerMemoryUsage = vi.fn()

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: { getSettings },
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...await importOriginal<typeof import('@activepieces/server-utils')>(),
    systemUsage: { getContainerMemoryUsage },
}))

const ONE_GIB_IN_BYTES = 1024 * 1024 * 1024

async function loadSandboxConfig() {
    vi.resetModules()
    const module = await import('../../src/lib/runtime/sandbox-config')
    return module.sandboxConfig
}

describe('sandboxConfig memory limit', () => {
    beforeEach(() => {
        getSettings.mockReturnValue({ SANDBOX_MEMORY_LIMIT: '1048576' })
        getContainerMemoryUsage.mockReset()
    })

    it('uses the server-provided limit before the ceiling is primed', async () => {
        const sandboxConfig = await loadSandboxConfig()
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('clamps a limit that would fill the whole container', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryUsage.mockResolvedValue({ totalRamInBytes: ONE_GIB_IN_BYTES, ramUsage: 0 })
        await sandboxConfig.primeEngineHeapCeiling({ concurrency: 1 })
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('720896')
    })

    it('divides the remaining budget across concurrent boxes', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryUsage.mockResolvedValue({ totalRamInBytes: 4 * ONE_GIB_IN_BYTES, ramUsage: 0 })
        await sandboxConfig.primeEngineHeapCeiling({ concurrency: 5 })
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('773324')
    })

    it('honors a configured limit that already fits', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getSettings.mockReturnValue({ SANDBOX_MEMORY_LIMIT: '262144' })
        getContainerMemoryUsage.mockResolvedValue({ totalRamInBytes: ONE_GIB_IN_BYTES, ramUsage: 0 })
        await sandboxConfig.primeEngineHeapCeiling({ concurrency: 1 })
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('262144')
    })

    it('never drops below the floor on an undersized container', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryUsage.mockResolvedValue({ totalRamInBytes: 256 * 1024 * 1024, ramUsage: 0 })
        await sandboxConfig.primeEngineHeapCeiling({ concurrency: 1 })
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('131072')
    })

    it('keeps the configured limit when the container size cannot be read', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryUsage.mockRejectedValue(new Error('no cgroup'))
        await sandboxConfig.primeEngineHeapCeiling({ concurrency: 1 })
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })
})
