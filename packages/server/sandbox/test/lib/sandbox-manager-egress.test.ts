import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'

const { createEgressNetnsMock, destroyMock, resolveApiEgressCachedMock } = vi.hoisted(() => ({
    createEgressNetnsMock: vi.fn(),
    destroyMock: vi.fn(),
    resolveApiEgressCachedMock: vi.fn(),
}))

vi.mock('../../src/lib/sandbox/netns', () => ({
    createEgressNetns: createEgressNetnsMock,
    resolveApiEgressCached: resolveApiEgressCachedMock,
}))

// Stands in for sandbox.start(), which runs AFTER the gate, so gate contracts use isEgressUnhealthy alone.
let capturedGetEgress: ((log: unknown) => Promise<unknown>) | undefined

vi.mock('../../src/lib/create-sandbox-for-job', () => ({
    createSandboxForJob: vi.fn((params: { getEgress?: (log: unknown) => Promise<unknown> }) => {
        capturedGetEgress = params.getEgress
        return { isReady: () => true, start: vi.fn().mockResolvedValue(undefined), shutdown: vi.fn().mockResolvedValue(undefined) }
    }),
    isIsolateMode: (mode: string) => mode === ExecutionMode.SANDBOX_PROCESS || mode === ExecutionMode.SANDBOX_CODE_AND_PROCESS,
}))

import { createSandboxForJob } from '../../src/lib/create-sandbox-for-job'
import { createSandboxManager } from '../../src/lib/sandbox-manager'

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

// Resolved once per getEgress and threaded through, so the cache key and the installed rules agree.
const apiEgress = (fingerprint: string) => ({ endpoints: [], pinHostname: null, fingerprint })

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

function buildSettings({ executionMode, networkMode }: { executionMode: string, networkMode: NetworkMode }) {
    return {
        EXECUTION_MODE: executionMode,
        NETWORK_MODE: networkMode,
        ENVIRONMENT: ApEnvironment.PRODUCTION,
        REUSE_SANDBOX: undefined as string | undefined,
        FLOW_TIMEOUT_SECONDS: 600,
        MAX_FLOW_RUN_LOG_SIZE_MB: 10,
        MAX_FILE_SIZE_MB: 10,
        SANDBOX_MEMORY_LIMIT: '1024',
        SANDBOX_PROPAGATED_ENV_VARS: [] as string[],
        DEV_PIECES: [] as string[],
        SSRF_ALLOW_LIST: [] as string[],
    } as never
}

const strictSettings = (over: { allowList?: string[] } = {}) => ({
    ...buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.STRICT }),
    ...(over.allowList ? { SSRF_ALLOW_LIST: over.allowList } : {}),
} as never)

const strictManager = (over: { internalApiUrl?: string, settings?: unknown } = {}) => createSandboxManager({
    boxId: 1,
    basePath: '/tmp',
    getSettings: () => (over.settings ?? strictSettings()) as never,
    internalApiUrl: over.internalApiUrl,
})

const handle = (over: Record<string, unknown> = {}) => ({
    netnsName: 'ap-egress-1',
    gatewayHost: '10.255.0.5',
    callbackApiUrl: null,
    callbackPort: null,
    apiAllow: null,
    apiHostPin: null,
    fingerprint: '',
    destroy: destroyMock,
    ...over,
})

const info = (over: Record<string, unknown> = {}) => {
    const { destroy, ...rest } = handle(over)
    void destroy
    return rest
}

describe('sandbox-manager egress lifecycle', () => {
    beforeEach(() => {
        // The probe-window cases fake the clock; restoring here stops a leak reaching later tests.
        vi.useRealTimers()
        createEgressNetnsMock.mockReset()
        destroyMock.mockReset()
        resolveApiEgressCachedMock.mockReset()
        resolveApiEgressCachedMock.mockResolvedValue(apiEgress(''))
        capturedGetEgress = undefined
    })

    it('creates the netns once (cached) under isolate + STRICT and destroys it on shutdown', async () => {
        createEgressNetnsMock.mockResolvedValue(handle())
        const manager = strictManager()

        await manager.acquire({ log })
        expect(capturedGetEgress).toBeDefined()

        const first = await capturedGetEgress!(log)
        const second = await capturedGetEgress!(log)

        expect(first).toEqual(info())
        expect(second).toEqual(info())
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(1)
        expect(createEgressNetnsMock).toHaveBeenCalledWith({ log, boxId: 1, internalApiUrl: undefined, allowList: [], apiEgress: apiEgress('') })

        await manager.shutdown(log)
        expect(destroyMock).toHaveBeenCalledTimes(1)
    })

    it('forwards internalApiUrl to netns creation and surfaces the gateway callback URL + host pin', async () => {
        createEgressNetnsMock.mockResolvedValue(handle({ callbackApiUrl: 'http://10.255.0.5:3000/api/', callbackPort: 3000 }))
        const manager = strictManager({ internalApiUrl: 'http://127.0.0.1:3000/api/' })

        await manager.acquire({ log })
        const egress = await capturedGetEgress!(log)

        expect(createEgressNetnsMock).toHaveBeenCalledWith({ log, boxId: 1, internalApiUrl: 'http://127.0.0.1:3000/api/', allowList: [], apiEgress: apiEgress('') })
        expect(egress).toEqual(info({ callbackApiUrl: 'http://10.255.0.5:3000/api/', callbackPort: 3000 }))
    })

    it('awaits an in-flight create during shutdown and destroys it (no leak on the race)', async () => {
        let resolveCreate: (() => void) | undefined
        const created = { netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5', destroy: destroyMock }
        createEgressNetnsMock.mockReturnValue(new Promise((resolve) => { resolveCreate = () => resolve(created) }))
        const manager = strictManager()

        await manager.acquire({ log })
        // Kick off creation but do NOT await it — simulates sandbox.start() still in flight...
        const inflight = capturedGetEgress!(log)
        // ...when shutdown races in. teardown must await the pending create, not skip it.
        const shutdownP = manager.shutdown(log)
        resolveCreate!()
        await inflight.catch(() => undefined)
        await shutdownP

        expect(createEgressNetnsMock).toHaveBeenCalledTimes(1)
        expect(destroyMock).toHaveBeenCalledTimes(1)
    })

    it('shutdown waits for an in-flight start() to settle before destroying the netns', async () => {
        createEgressNetnsMock.mockResolvedValue({ netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5', destroy: destroyMock })
        let resolveStart: () => void = () => undefined
        const startGate = new Promise<void>((resolve) => { resolveStart = resolve })
        const shutdownSpy = vi.fn().mockResolvedValue(undefined)
        vi.mocked(createSandboxForJob).mockImplementationOnce(((params: { getEgress?: (log: unknown) => Promise<unknown> }) => ({
            isReady: () => false,
            shutdown: shutdownSpy,
            start: async () => { await params.getEgress!(log); await startGate }, // creates netns, then blocks
        })) as never)
        const manager = strictManager()

        const sandbox = await manager.acquire({ log })
        const startPromise = sandbox.start({ flowVersionId: undefined, platformId: 'p1', mounts: [] })
        await tick() // let start() run getEgress (creates the netns) then block on the gate

        let shutdownDone = false
        const shutdownPromise = manager.shutdown(log).then(() => { shutdownDone = true })
        await tick()
        expect(shutdownDone).toBe(false)             // shutdown is blocked on the in-flight start
        expect(destroyMock).not.toHaveBeenCalled()   // netns must NOT be torn down mid-startup

        resolveStart()
        await startPromise
        await shutdownPromise
        expect(shutdownSpy).toHaveBeenCalled()       // invalidate ran (would kill the child) first
        expect(destroyMock).toHaveBeenCalledTimes(1) // netns destroyed only after start settled
    })

    it('does NOT create a netns when NETWORK_MODE is UNRESTRICTED (guards the settings-drift class)', async () => {
        const manager = strictManager({ settings: buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.UNRESTRICTED }) })

        await manager.acquire({ log })
        const result = await capturedGetEgress!(log)

        expect(result).toBeNull()
        expect(createEgressNetnsMock).not.toHaveBeenCalled()
        await manager.shutdown(log)
        expect(destroyMock).not.toHaveBeenCalled()
    })

    it('does NOT create a netns for a non-isolate mode even under STRICT', async () => {
        const manager = strictManager({ settings: buildSettings({ executionMode: ExecutionMode.SANDBOX_CODE_ONLY, networkMode: NetworkMode.STRICT }) })

        await manager.acquire({ log })
        const result = await capturedGetEgress!(log)

        expect(result).toBeNull()
        expect(createEgressNetnsMock).not.toHaveBeenCalled()
    })

    it('retries creation on a later start after a failure (does not cache the rejection)', async () => {
        createEgressNetnsMock
            .mockRejectedValueOnce(new Error('no NET_ADMIN'))
            .mockResolvedValueOnce(handle())
        const manager = strictManager()

        await manager.acquire({ log })
        await expect(capturedGetEgress!(log)).rejects.toThrow(/no NET_ADMIN/)
        const retried = await capturedGetEgress!(log)

        expect(retried).toEqual(info())
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(2)
    })

    // Without this the box fails every job routed to it while the worker still reports healthy.
    it('reports the box unhealthy after repeated egress failures so the poll loop can back it off', async () => {
        createEgressNetnsMock.mockRejectedValue(new Error('no NET_ADMIN'))
        const manager = strictManager()

        await manager.acquire({ log })
        expect(manager.isEgressUnhealthy()).toBe(false)

        await expect(capturedGetEgress!(log)).rejects.toThrow()
        await expect(capturedGetEgress!(log)).rejects.toThrow()
        expect(manager.isEgressUnhealthy()).toBe(false)

        await expect(capturedGetEgress!(log)).rejects.toThrow()
        expect(manager.isEgressUnhealthy()).toBe(true)
    })

    it('clears the unhealthy verdict when a create succeeds', async () => {
        createEgressNetnsMock
            .mockRejectedValueOnce(new Error('boom'))
            .mockRejectedValueOnce(new Error('boom'))
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce(handle())
        const manager = strictManager()

        await manager.acquire({ log })
        for (let attempt = 0; attempt < 3; attempt++) {
            await expect(capturedGetEgress!(log)).rejects.toThrow()
        }
        expect(manager.isEgressUnhealthy()).toBe(true)

        await capturedGetEgress!(log)
        expect(manager.isEgressUnhealthy()).toBe(false)
    })

    // The verdict must clear WITHOUT calling getEgress, since the gate returns before the job that would.
    it('re-arms after the probe window without any getEgress call', async () => {
        createEgressNetnsMock.mockRejectedValue(new Error('no NET_ADMIN'))
        const manager = strictManager()

        await manager.acquire({ log })
        for (let attempt = 0; attempt < 3; attempt++) {
            await expect(capturedGetEgress!(log)).rejects.toThrow()
        }
        expect(manager.isEgressUnhealthy()).toBe(true)

        vi.useFakeTimers({ shouldAdvanceTime: true })
        vi.setSystemTime(Date.now() + 30_001)

        expect(manager.isEgressUnhealthy()).toBe(false)
    })

    it('re-latches when the probe fails again (half-open, not permanently open)', async () => {
        createEgressNetnsMock.mockRejectedValue(new Error('no NET_ADMIN'))
        const manager = strictManager()

        await manager.acquire({ log })
        for (let attempt = 0; attempt < 3; attempt++) {
            await expect(capturedGetEgress!(log)).rejects.toThrow()
        }
        vi.useFakeTimers({ shouldAdvanceTime: true })
        vi.setSystemTime(Date.now() + 30_001)
        expect(manager.isEgressUnhealthy()).toBe(false)

        await expect(capturedGetEgress!(log)).rejects.toThrow()

        expect(manager.isEgressUnhealthy()).toBe(true)
    })

    it('serves the existing namespace when the app API can no longer be resolved', async () => {
        createEgressNetnsMock.mockResolvedValue(handle({ apiAllow: '10.0.0.9:443', apiHostPin: 'api.internal=10.0.0.9', fingerprint: 'fp-1' }))
        const manager = strictManager()

        await manager.acquire({ log })
        const first = await capturedGetEgress!(log)
        resolveApiEgressCachedMock.mockRejectedValue(new Error('cannot resolve internalApiUrl host'))

        const second = await capturedGetEgress!(log)

        expect(second).toEqual(first)
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(1)
        expect(destroyMock).not.toHaveBeenCalled()
        expect(manager.isEgressUnhealthy()).toBe(false)
    })

    it('still fails when the app API cannot be resolved and no namespace exists yet', async () => {
        resolveApiEgressCachedMock.mockRejectedValue(new Error('cannot resolve internalApiUrl host'))
        const manager = strictManager()

        await manager.acquire({ log })

        await expect(capturedGetEgress!(log)).rejects.toThrow(/cannot resolve internalApiUrl host/)
        expect(createEgressNetnsMock).not.toHaveBeenCalled()
    })

    it('never reports a non-STRICT box unhealthy (getEgress is a no-op there)', async () => {
        const manager = strictManager({ settings: buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.UNRESTRICTED }) })

        await manager.acquire({ log })
        for (let attempt = 0; attempt < 5; attempt++) {
            expect(await capturedGetEgress!(log)).toBeNull()
        }
        expect(manager.isEgressUnhealthy()).toBe(false)
    })

    it('recreates the netns when SSRF_ALLOW_LIST changes between getEgress calls', async () => {
        destroyMock.mockResolvedValue(undefined)
        createEgressNetnsMock
            .mockResolvedValueOnce(handle())
            .mockResolvedValueOnce(handle())
        let allowList: string[] = []
        const base = buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.STRICT })
        const manager = createSandboxManager({
            boxId: 1,
            basePath: '/tmp',
            getSettings: () => ({ ...base, SSRF_ALLOW_LIST: allowList }),
        })

        await manager.acquire({ log })
        await capturedGetEgress!(log)
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(1)
        expect(createEgressNetnsMock).toHaveBeenLastCalledWith(expect.objectContaining({ allowList: [] }))

        allowList = ['10.9.9.9/32']
        await capturedGetEgress!(log)

        expect(destroyMock).toHaveBeenCalledTimes(1)
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(2)
        expect(createEgressNetnsMock).toHaveBeenLastCalledWith(expect.objectContaining({ allowList: ['10.9.9.9/32'] }))
    })

    it('recreates the netns when the API DNS fingerprint changes', async () => {
        destroyMock.mockResolvedValue(undefined)
        resolveApiEgressCachedMock
            .mockResolvedValueOnce(apiEgress('10.0.0.9:3000'))
            .mockResolvedValueOnce(apiEgress('10.0.0.10:3000'))
        createEgressNetnsMock
            .mockResolvedValueOnce(handle({ apiAllow: '10.0.0.9:3000', apiHostPin: 'api.internal=10.0.0.9', fingerprint: '10.0.0.9:3000' }))
            .mockResolvedValueOnce(handle({ apiAllow: '10.0.0.10:3000', apiHostPin: 'api.internal=10.0.0.10', fingerprint: '10.0.0.10:3000' }))
        const settings = buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.STRICT })
        const manager = createSandboxManager({
            boxId: 1,
            basePath: '/tmp',
            getSettings: () => settings,
            internalApiUrl: 'http://api.internal/api/',
        })

        await manager.acquire({ log })
        const first = await capturedGetEgress!(log)
        expect(first).toMatchObject({ apiAllow: '10.0.0.9:3000', fingerprint: '10.0.0.9:3000' })
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(1)

        const second = await capturedGetEgress!(log)
        expect(destroyMock).toHaveBeenCalledTimes(1)
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(2)
        expect(second).toMatchObject({ apiAllow: '10.0.0.10:3000', fingerprint: '10.0.0.10:3000' })
    })

    it('awaits the previous sandbox shutdown before creating a replacement', async () => {
        let resolveShutdown: () => void = () => undefined
        const shutdownGate = new Promise<void>((resolve) => { resolveShutdown = resolve })
        const firstShutdown = vi.fn(() => shutdownGate)
        const secondShutdown = vi.fn().mockResolvedValue(undefined)
        vi.mocked(createSandboxForJob).mockReset()
        vi.mocked(createSandboxForJob)
            .mockImplementationOnce(((params: { getEgress?: (log: unknown) => Promise<unknown> }) => {
                capturedGetEgress = params.getEgress
                return {
                    isReady: () => false,
                    start: vi.fn().mockResolvedValue(undefined),
                    shutdown: firstShutdown,
                }
            }) as never)
            .mockImplementationOnce(((params: { getEgress?: (log: unknown) => Promise<unknown> }) => {
                capturedGetEgress = params.getEgress
                return {
                    isReady: () => true,
                    start: vi.fn().mockResolvedValue(undefined),
                    shutdown: secondShutdown,
                }
            }) as never)
        const manager = strictManager()

        await manager.acquire({ log })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)

        let secondReady = false
        const secondAcquire = manager.acquire({ log }).then(() => { secondReady = true })
        await tick()
        expect(firstShutdown).toHaveBeenCalled()
        expect(secondReady).toBe(false)
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)

        resolveShutdown()
        await secondAcquire
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })
})
