import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'

const mockGetSettings = vi.fn()
const mockPrepare = vi.fn()
const mockExtractPieces = vi.fn()

vi.mock('../../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: (...args: unknown[]) => mockGetSettings(...args),
    },
}))

vi.mock('../../../../../src/lib/execute/runtime/worker-pool/create-sandbox-for-job', () => ({
    createSandboxForJob: vi.fn().mockReturnValue({
        isReady: () => true,
        start: vi.fn().mockResolvedValue(undefined),
        shutdown: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../../../src/lib/execute/cache/preparer', () => ({
    cachePreparer: () => ({ prepare: mockPrepare }),
}))

vi.mock('../../../../../src/lib/execute/utils/flow-helpers', () => ({
    extractPiecePackages: (...args: unknown[]) => mockExtractPieces(...args),
    extractCodeArtifacts: () => [],
}))

vi.mock('../../../../../src/lib/egress/lifecycle', () => ({
    getActiveProxyPort: () => null,
}))

vi.mock('../../../../../src/lib/config/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnValue({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        }),
    },
}))

import { createWorkerPoolRuntime } from '../../../../../src/lib/execute/runtime/worker-pool/worker-pool-runtime'
import { logger } from '../../../../../src/lib/config/logger'
import { FlowExecutionRuntime } from '../../../../../src/lib/execute/runtime/types'
import { PieceNotFoundError } from '../../../../../src/lib/execute/cache/pieces/piece-cache'

function buildSettings({ executionMode, environment }: { executionMode: string, environment: string }) {
    return {
        PUBLIC_URL: 'http://localhost:3000',
        TRIGGER_TIMEOUT_SECONDS: 60,
        TRIGGER_HOOKS_TIMEOUT_SECONDS: 60,
        PAUSED_FLOW_TIMEOUT_DAYS: 30,
        EXECUTION_MODE: executionMode,
        FLOW_TIMEOUT_SECONDS: 600,
        LOG_LEVEL: 'info',
        LOG_PRETTY: 'false',
        ENVIRONMENT: environment,
        APP_WEBHOOK_SECRETS: '{}',
        MAX_FLOW_RUN_LOG_SIZE_MB: 10,
        MAX_FILE_SIZE_MB: 10,
        SANDBOX_MEMORY_LIMIT: '1024',
        SANDBOX_PROPAGATED_ENV_VARS: [],
        DEV_PIECES: [],
        OTEL_ENABLED: false,
        FILE_STORAGE_LOCATION: '/tmp',
        S3_USE_SIGNED_URLS: 'false',
        EVENT_DESTINATION_TIMEOUT_SECONDS: 30,
        EDITION: 'community',
        NETWORK_MODE: NetworkMode.UNRESTRICTED,
        SSRF_ALLOW_LIST: [],
    }
}

const mockApiClient = {} as never
const readyOnce = (runtime: FlowExecutionRuntime): Promise<unknown> =>
    runtime.ready({ operation: { kind: 'PIECE', piece: {} as never, platformId: 'platform-1' }, log: logger, apiClient: mockApiClient })

describe('worker-pool-runtime canReuseSandbox', () => {
    const log = logger

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('SANDBOX_PROCESS mode → sandbox NOT reusable (release invalidates)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_PROCESS,
            environment: ApEnvironment.PRODUCTION,
        }))

        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await readyOnce(runtime)
        await runtime.release(log)

        // After release with non-reusable mode, acquiring again should create a fresh sandbox
        // We verify by checking that invalidate was called (sandbox set to null)
        const { createSandboxForJob } = await import('../../../../../src/lib/execute/runtime/worker-pool/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)

        // Ready again — should create new sandbox since previous was invalidated
        await readyOnce(runtime)
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('SANDBOX_CODE_AND_PROCESS mode → sandbox NOT reusable (release invalidates)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_AND_PROCESS,
            environment: ApEnvironment.PRODUCTION,
        }))

        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await readyOnce(runtime)
        await runtime.release(log)

        const { createSandboxForJob } = await import('../../../../../src/lib/execute/runtime/worker-pool/create-sandbox-for-job')
        await readyOnce(runtime)
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('SANDBOX_CODE_ONLY mode → sandbox reusable (release does NOT invalidate)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_ONLY,
            environment: ApEnvironment.PRODUCTION,
        }))

        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await readyOnce(runtime)
        await runtime.release(log)

        const { createSandboxForJob } = await import('../../../../../src/lib/execute/runtime/worker-pool/create-sandbox-for-job')
        // Ready again — should reuse (not create new)
        await readyOnce(runtime)
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('UNSANDBOXED mode → sandbox reusable (release does NOT invalidate)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.UNSANDBOXED,
            environment: ApEnvironment.PRODUCTION,
        }))

        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await readyOnce(runtime)
        await runtime.release(log)

        const { createSandboxForJob } = await import('../../../../../src/lib/execute/runtime/worker-pool/create-sandbox-for-job')
        await readyOnce(runtime)
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('DEVELOPMENT environment → sandbox reusable regardless of execution mode', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_PROCESS,
            environment: ApEnvironment.DEVELOPMENT,
        }))

        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await readyOnce(runtime)
        await runtime.release(log)

        const { createSandboxForJob } = await import('../../../../../src/lib/execute/runtime/worker-pool/create-sandbox-for-job')
        await readyOnce(runtime)
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })
})

describe('worker-pool-runtime ready provisioning', () => {
    const flowOperation = {
        kind: 'FLOW' as const,
        flowVersion: { id: 'fv-1' } as never,
        platformId: 'platform-1',
        flowId: 'flow-1',
        projectId: 'project-1',
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_ONLY,
            environment: ApEnvironment.PRODUCTION,
        }))
        mockExtractPieces.mockResolvedValue([])
        mockPrepare.mockResolvedValue(undefined)
    })

    it('returns a ready sandbox when provisioning succeeds (no disableFlow)', async () => {
        const disableFlow = vi.fn()
        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        const sandbox = await runtime.ready({ operation: flowOperation, log: logger, apiClient: { disableFlow } as never })
        expect(sandbox).toBeDefined()
        expect(disableFlow).not.toHaveBeenCalled()
    })

    it('disables the flow and rethrows when a piece is missing', async () => {
        mockExtractPieces.mockRejectedValue(new PieceNotFoundError('@activepieces/piece-agent', '0.3.7'))
        const disableFlow = vi.fn().mockResolvedValue(undefined)
        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await expect(runtime.ready({ operation: flowOperation, log: logger, apiClient: { disableFlow } as never }))
            .rejects.toBeInstanceOf(PieceNotFoundError)
        expect(disableFlow).toHaveBeenCalledWith({ flowId: 'flow-1', projectId: 'project-1' })
    })

    it('rethrows transient provisioning errors without disabling the flow', async () => {
        mockPrepare.mockRejectedValue(new Error('Failed to provision piece'))
        const disableFlow = vi.fn()
        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await expect(runtime.ready({ operation: flowOperation, log: logger, apiClient: { disableFlow } as never }))
            .rejects.toThrow('Failed to provision piece')
        expect(disableFlow).not.toHaveBeenCalled()
    })

    it('still rethrows when disableFlow itself fails', async () => {
        mockExtractPieces.mockRejectedValue(new PieceNotFoundError('@activepieces/piece-agent', '0.3.7'))
        const disableFlow = vi.fn().mockRejectedValue(new Error('Network error'))
        const runtime = createWorkerPoolRuntime({ boxId: 1 })
        await expect(runtime.ready({ operation: flowOperation, log: logger, apiClient: { disableFlow } as never }))
            .rejects.toBeInstanceOf(PieceNotFoundError)
        expect(disableFlow).toHaveBeenCalled()
    })
})
