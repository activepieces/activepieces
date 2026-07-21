import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'

const { createEgressNetnsMock, destroyMock } = vi.hoisted(() => ({
    createEgressNetnsMock: vi.fn(),
    destroyMock: vi.fn(),
}))

vi.mock('../../src/lib/sandbox/netns', () => ({
    createEgressNetns: createEgressNetnsMock,
}))

// Capture the getEgress the manager wires into each sandbox so we can drive it the way
// sandbox.start() does, without standing up the real socket server / isolate process.
let capturedGetEgress: ((log: unknown) => Promise<unknown>) | undefined

vi.mock('../../src/lib/create-sandbox-for-job', () => ({
    createSandboxForJob: vi.fn((params: { getEgress?: (log: unknown) => Promise<unknown> }) => {
        capturedGetEgress = params.getEgress
        return { isReady: () => true, shutdown: vi.fn().mockResolvedValue(undefined) }
    }),
    isIsolateMode: (mode: string) => mode === ExecutionMode.SANDBOX_PROCESS || mode === ExecutionMode.SANDBOX_CODE_AND_PROCESS,
}))

import { createSandboxManager } from '../../src/lib/sandbox-manager'

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

describe('sandbox-manager egress lifecycle', () => {
    beforeEach(() => {
        createEgressNetnsMock.mockReset()
        destroyMock.mockReset()
        capturedGetEgress = undefined
    })

    it('creates the netns once (cached) under isolate + STRICT and destroys it on shutdown', async () => {
        createEgressNetnsMock.mockResolvedValue({ netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5', destroy: destroyMock })
        const settings = buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.STRICT })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })

        manager.acquire({ log })
        expect(capturedGetEgress).toBeDefined()

        const first = await capturedGetEgress!(log)
        const second = await capturedGetEgress!(log)

        expect(first).toEqual({ netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5' })
        expect(second).toEqual({ netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5' })
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(1)
        expect(createEgressNetnsMock).toHaveBeenCalledWith({ log, boxId: 1 })

        await manager.shutdown(log)
        expect(destroyMock).toHaveBeenCalledTimes(1)
    })

    it('does NOT create a netns when NETWORK_MODE is UNRESTRICTED (guards the settings-drift class)', async () => {
        const settings = buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.UNRESTRICTED })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })

        manager.acquire({ log })
        const result = await capturedGetEgress!(log)

        expect(result).toBeNull()
        expect(createEgressNetnsMock).not.toHaveBeenCalled()
        await manager.shutdown(log)
        expect(destroyMock).not.toHaveBeenCalled()
    })

    it('does NOT create a netns for a non-isolate mode even under STRICT', async () => {
        const settings = buildSettings({ executionMode: ExecutionMode.SANDBOX_CODE_ONLY, networkMode: NetworkMode.STRICT })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })

        manager.acquire({ log })
        const result = await capturedGetEgress!(log)

        expect(result).toBeNull()
        expect(createEgressNetnsMock).not.toHaveBeenCalled()
    })

    it('retries creation on a later start after a failure (does not cache the rejection)', async () => {
        createEgressNetnsMock
            .mockRejectedValueOnce(new Error('no NET_ADMIN'))
            .mockResolvedValueOnce({ netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5', destroy: destroyMock })
        const settings = buildSettings({ executionMode: ExecutionMode.SANDBOX_PROCESS, networkMode: NetworkMode.STRICT })
        const manager = createSandboxManager({ boxId: 1, basePath: '/tmp', getSettings: () => settings })

        manager.acquire({ log })
        await expect(capturedGetEgress!(log)).rejects.toThrow(/no NET_ADMIN/)
        const retried = await capturedGetEgress!(log)

        expect(retried).toEqual({ netnsName: 'ap-egress-1', gatewayHost: '10.255.0.5' })
        expect(createEgressNetnsMock).toHaveBeenCalledTimes(2)
    })
})
