import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExecutionMode } from '@activepieces/shared'

vi.mock('../../../../../src/app/workers/machine/machine-cache', () => ({
    workerMachineCache: vi.fn(() => ({
        findOne: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
    })),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getOrThrow: vi.fn().mockReturnValue('test-value'),
        getNumberOrThrow: vi.fn().mockReturnValue(60),
        get: vi.fn().mockReturnValue(undefined),
    },
}))

vi.mock('../../../../../src/app/ee/custom-domains/domain-helper', () => ({
    domainHelper: {
        getPublicUrl: vi.fn().mockResolvedValue('https://example.com'),
    },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-dedicated-workers', () => ({
    dedicatedWorkers: vi.fn(),
}))

import { machineService } from '../../../../../src/app/workers/machine/machine-service'
import { dedicatedWorkers } from '../../../../../src/app/ee/platform/platform-plan/platform-dedicated-workers'
import { system } from '../../../../../src/app/helper/system/system'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as any

const mockHealthcheck = {
    workerId: 'test-worker-1',
    cpuUsagePercentage: 10,
    ramUsagePercentage: 20,
    totalAvailableRamInBytes: 1024,
    diskInfo: {
        total: 1000,
        free: 500,
        used: 500,
        percentage: 50,
    },
}

describe('machineService — getExecutionMode', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Clear settings cache by re-importing (settingsCache is module-scoped)
        vi.resetModules()
    })

    it('should return SANDBOX_PROCESS for trusted dedicated worker', async () => {
        vi.mocked(system.getOrThrow).mockReturnValue(ExecutionMode.SANDBOX_PROCESS as any)
        vi.mocked(dedicatedWorkers).mockReturnValue({
            getWorkerConfig: vi.fn().mockResolvedValue({ trustedEnvironment: true }),
            getPlatformIds: vi.fn(),
            isEnabledForPlatform: vi.fn(),
            updateWorkerConfig: vi.fn(),
        } as any)

        const { machineService: freshMachineService } = await import('../../../../../src/app/workers/machine/machine-service')
        const result = await freshMachineService(mockLog).onConnection(mockHealthcheck, 'platform-123')

        expect(result.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_PROCESS)
    })

    it('should return SANDBOX_CODE_AND_PROCESS for untrusted dedicated worker', async () => {
        vi.mocked(system.getOrThrow).mockReturnValue(ExecutionMode.SANDBOX_PROCESS as any)
        vi.mocked(dedicatedWorkers).mockReturnValue({
            getWorkerConfig: vi.fn().mockResolvedValue({ trustedEnvironment: false }),
            getPlatformIds: vi.fn(),
            isEnabledForPlatform: vi.fn(),
            updateWorkerConfig: vi.fn(),
        } as any)

        const { machineService: freshMachineService } = await import('../../../../../src/app/workers/machine/machine-service')
        const result = await freshMachineService(mockLog).onConnection(mockHealthcheck, 'platform-456')

        expect(result.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_CODE_AND_PROCESS)
    })

    it('should return system default for shared workers (no platformId)', async () => {
        vi.mocked(system.getOrThrow).mockReturnValue(ExecutionMode.SANDBOX_PROCESS as any)

        const { machineService: freshMachineService } = await import('../../../../../src/app/workers/machine/machine-service')
        const result = await freshMachineService(mockLog).onConnection(mockHealthcheck)

        expect(result.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_PROCESS)
    })

    it('should return system default when dedicated worker config is null', async () => {
        vi.mocked(system.getOrThrow).mockReturnValue(ExecutionMode.SANDBOX_PROCESS as any)
        vi.mocked(dedicatedWorkers).mockReturnValue({
            getWorkerConfig: vi.fn().mockResolvedValue(null),
            getPlatformIds: vi.fn(),
            isEnabledForPlatform: vi.fn(),
            updateWorkerConfig: vi.fn(),
        } as any)

        const { machineService: freshMachineService } = await import('../../../../../src/app/workers/machine/machine-service')
        const result = await freshMachineService(mockLog).onConnection(mockHealthcheck, 'platform-789')

        expect(result.EXECUTION_MODE).toBe(ExecutionMode.SANDBOX_PROCESS)
    })
})
