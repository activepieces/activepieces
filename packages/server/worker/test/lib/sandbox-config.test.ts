import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSettings = vi.fn()
const getContainerMemoryLimitInBytes = vi.fn()

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: { getSettings },
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...await importOriginal<typeof import('@activepieces/server-utils')>(),
    systemUsage: { getContainerMemoryLimitInBytes },
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
        getContainerMemoryLimitInBytes.mockReset()
    })

    it('uses the server-provided limit before the ceiling is primed', async () => {
        const sandboxConfig = await loadSandboxConfig()
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('clamps a limit that would fill the whole container', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('720896')
    })

    it('divides the remaining budget across concurrent boxes', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(4 * ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 5 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('773324')
    })

    it('honors a configured limit that already fits', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getSettings.mockReturnValue({ SANDBOX_MEMORY_LIMIT: '262144' })
        getContainerMemoryLimitInBytes.mockResolvedValue(ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('262144')
    })

    it('never drops below the floor on an undersized container', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(256 * 1024 * 1024)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('131072')
    })

    it('keeps the configured limit when the container size cannot be read', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockRejectedValue(new Error('unreadable'))
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('does not publish a ceiling derived by an abandoned generation', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('720896')

        getContainerMemoryLimitInBytes.mockResolvedValue(4 * ONE_GIB_IN_BYTES)
        const abandoned = await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 })
        expect(abandoned).toBe(3866624)
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('720896')
    })

    it('does not clamp when the process is unconstrained', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(null)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 5 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('drops a previously derived ceiling when the limit is no longer readable', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('720896')

        getContainerMemoryLimitInBytes.mockResolvedValue(null)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })

    it('re-derives the ceiling when the container is resized', async () => {
        const sandboxConfig = await loadSandboxConfig()
        getContainerMemoryLimitInBytes.mockResolvedValue(ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('720896')

        getContainerMemoryLimitInBytes.mockResolvedValue(2 * ONE_GIB_IN_BYTES)
        sandboxConfig.applyEngineHeapCeiling(await sandboxConfig.deriveEngineHeapCeilingKb({ concurrency: 1 }))
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })
})
