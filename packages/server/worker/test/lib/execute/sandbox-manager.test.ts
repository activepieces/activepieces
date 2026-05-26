import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'

const mockGetSettings = vi.fn()

vi.mock('../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: (...args: unknown[]) => mockGetSettings(...args),
    },
}))

vi.mock('../../../src/lib/execute/create-sandbox-for-job', () => ({
    createSandboxForJob: vi.fn().mockReturnValue({
        isReady: () => true,
        shutdown: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../src/lib/config/logger', () => ({
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

import { createSandboxManager } from '../../../src/lib/execute/sandbox-manager'
import { logger } from '../../../src/lib/config/logger'

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

describe('sandbox-manager canReuseSandbox', () => {
    const log = logger

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('SANDBOX_PROCESS mode → sandbox NOT reusable (release invalidates)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_PROCESS,
            environment: ApEnvironment.PRODUCTION,
        }))

        const manager = createSandboxManager(1)
        const mockApiClient = {} as never
        manager.acquire({ log, apiClient: mockApiClient })
        await manager.release(log)

        // After release with non-reusable mode, acquiring again should create a fresh sandbox
        // We verify by checking that invalidate was called (sandbox set to null)
        const { createSandboxForJob } = await import('../../../src/lib/execute/create-sandbox-for-job')
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)

        // Acquire again — should create new sandbox since previous was invalidated
        manager.acquire({ log, apiClient: mockApiClient })
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('SANDBOX_CODE_AND_PROCESS mode → sandbox NOT reusable (release invalidates)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_AND_PROCESS,
            environment: ApEnvironment.PRODUCTION,
        }))

        const manager = createSandboxManager(1)
        const mockApiClient = {} as never
        manager.acquire({ log, apiClient: mockApiClient })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../../src/lib/execute/create-sandbox-for-job')
        manager.acquire({ log, apiClient: mockApiClient })
        expect(createSandboxForJob).toHaveBeenCalledTimes(2)
    })

    it('SANDBOX_CODE_ONLY mode → sandbox reusable (release does NOT invalidate)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_CODE_ONLY,
            environment: ApEnvironment.PRODUCTION,
        }))

        const manager = createSandboxManager(1)
        const mockApiClient = {} as never
        manager.acquire({ log, apiClient: mockApiClient })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../../src/lib/execute/create-sandbox-for-job')
        // Acquire again — should reuse (not create new)
        manager.acquire({ log, apiClient: mockApiClient })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('UNSANDBOXED mode → sandbox reusable (release does NOT invalidate)', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.UNSANDBOXED,
            environment: ApEnvironment.PRODUCTION,
        }))

        const manager = createSandboxManager(1)
        const mockApiClient = {} as never
        manager.acquire({ log, apiClient: mockApiClient })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../../src/lib/execute/create-sandbox-for-job')
        manager.acquire({ log, apiClient: mockApiClient })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })

    it('DEVELOPMENT environment → sandbox reusable regardless of execution mode', async () => {
        mockGetSettings.mockReturnValue(buildSettings({
            executionMode: ExecutionMode.SANDBOX_PROCESS,
            environment: ApEnvironment.DEVELOPMENT,
        }))

        const manager = createSandboxManager(1)
        const mockApiClient = {} as never
        manager.acquire({ log, apiClient: mockApiClient })
        await manager.release(log)

        const { createSandboxForJob } = await import('../../../src/lib/execute/create-sandbox-for-job')
        manager.acquire({ log, apiClient: mockApiClient })
        expect(createSandboxForJob).toHaveBeenCalledTimes(1)
    })
})
