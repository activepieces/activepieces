import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetRawMany,
    mockQueryBuilder,
    mockExceptionHandle,
    mockCaptureLicenseKeyEvent,
    mockFlushBillingEvents,
    mockAppMachineList,
    mockWorkerMachineFind,
    mockCheckDatabaseHealth,
    mockGetReleaseHealth,
    mockGetEdition,
} = vi.hoisted(() => {
    const mockGetRawMany = vi.fn()
    const mockQueryBuilder = {
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        getRawMany: mockGetRawMany,
    }
    return {
        mockGetRawMany,
        mockQueryBuilder,
        mockExceptionHandle: vi.fn(),
        mockCaptureLicenseKeyEvent: vi.fn(),
        mockFlushBillingEvents: vi.fn().mockResolvedValue(undefined),
        mockAppMachineList: vi.fn().mockResolvedValue([]),
        mockWorkerMachineFind: vi.fn().mockResolvedValue([]),
        mockCheckDatabaseHealth: vi.fn().mockResolvedValue(true),
        mockGetReleaseHealth: vi.fn(() => ({
            current: '0.90.0',
            workers: { total: 0, versionMismatched: 0, mismatchedVersions: [] },
        })),
        mockGetEdition: vi.fn(() => 'ee'),
    }
})

const appInstance = (overrides: Record<string, unknown> = {}) => ({
    hostname: 'app-1',
    version: '0.90.0',
    cpuCores: 4,
    cpuUsagePercentage: 12,
    ramTotalBytes: 8_589_934_592,
    ramUsagePercentage: 40,
    diskPercentage: 55,
    diskTotalBytes: 536_870_912_000,
    eventLoopDelayMs: 3,
    updated: new Date().toISOString(),
    ...overrides,
})

const workerMachine = (overrides: Record<string, unknown> = {}) => ({
    id: 'worker-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    information: {
        workerId: 'worker-1',
        ip: '10.0.0.4',
        totalCpuCores: 2,
        totalAvailableRamInBytes: 2_147_483_648,
        cpuUsagePercentage: 20,
        ramUsagePercentage: 30,
        diskInfo: { total: 107_374_182_400, free: 50_000_000_000, used: 57_374_182_400, percentage: 53 },
        workerProps: {
            version: '0.90.0',
            EXECUTION_MODE: 'SANDBOX_CODE_ONLY',
            WORKER_CONCURRENCY: '1',
            SANDBOX_MEMORY_LIMIT: '1048576',
            REUSE_SANDBOX: 'true',
        },
        sandboxes: [],
    },
    ...overrides,
})

const createRepoMock = () => ({
    createQueryBuilder: vi.fn(() => ({ ...mockQueryBuilder, getRawMany: mockGetRawMany })),
})

vi.mock('../../../../../src/app/flows/flow/flow.repo', () => ({
    flowRepo: vi.fn(() => createRepoMock()),
}))

vi.mock('../../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunRepo: vi.fn(() => createRepoMock()),
}))

vi.mock('../../../../../src/app/user/user-service', () => ({
    userRepo: vi.fn(() => createRepoMock()),
}))

vi.mock('../../../../../src/app/project/project-repo', () => ({
    projectRepo: vi.fn(() => createRepoMock()),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanRepo: vi.fn(() => createRepoMock()),
}))

vi.mock('../../../../../src/app/helper/exception-handler', () => ({
    exceptionHandler: {
        handle: mockExceptionHandle,
    },
}))

vi.mock('../../../../../src/app/helper/sleep', () => ({
    sleep: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../../src/app/helper/telemetry.utils', () => ({
    captureLicesneKeyEvent: mockCaptureLicenseKeyEvent,
    flushBillingEvents: mockFlushBillingEvents,
    BILLING_EVENTS_FLUSH_BATCH_SIZE: 2,
    LicenseKeyPostHogEvents: {
        AI_USAGE_PER_RUN: 'ai_usage_per_run',
        CHAT_MESSAGE: 'chat_message',
        PLATFORM_SETUP_REPORT: 'platform_setup_report',
        TOTAL_RUNS_PER_DAY: 'total_runs_per_day',
    },
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getEdition: mockGetEdition,
    },
}))

vi.mock('../../../../../src/app/helper/app-machine-cache', () => ({
    appMachineCache: {
        list: mockAppMachineList,
    },
}))

vi.mock('../../../../../src/app/workers/machine/machine-cache', () => ({
    workerMachineCache: vi.fn(() => ({
        find: mockWorkerMachineFind,
    })),
}))

vi.mock('../../../../../src/app/health/health.service', () => ({
    healthStatusService: vi.fn(() => ({
        checkDatabaseHealth: mockCheckDatabaseHealth,
        getReleaseHealth: mockGetReleaseHealth,
    })),
}))

import { licenseKeyUsageReportService } from '../../../../../src/app/ee/license-key-usage-report/license-key-usage-report-service'

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
} as unknown as Parameters<typeof licenseKeyUsageReportService>[0]

// License keys are queried first (and gate the rest); the scoped count queries run afterwards in
// declaration order: active flows, users, team projects, then per-day executions — which itself runs
// two queries: a project->platform lookup followed by the flow_run aggregate (grouped by projectId).
const mockQueries = ({ licenseKeys = [], activeFlows = [], users = [], projects = [], executionProjects = [], executionRuns = [] }: {
    licenseKeys?: { platformId: string, licenseKey: string }[]
    activeFlows?: { platformId: string, count: string }[]
    users?: { platformId: string, count: string }[]
    projects?: { platformId: string, count: string }[]
    executionProjects?: { projectId: string, platformId: string }[]
    executionRuns?: { projectId: string, runDay: string, runCount: string }[]
}): void => {
    mockGetRawMany
        .mockResolvedValueOnce(licenseKeys)
        .mockResolvedValueOnce(activeFlows)
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce(projects)
        .mockResolvedValueOnce(executionProjects)
        .mockResolvedValueOnce(executionRuns)
}

const capturesOf = (event: string) =>
    mockCaptureLicenseKeyEvent.mock.calls
        .map((call) => call[0])
        .filter((capture) => capture.event === event)

describe('licenseKeyUsageReportService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetRawMany.mockReset().mockResolvedValue([])
        mockGetEdition.mockReturnValue('ee')
        mockAppMachineList.mockResolvedValue([])
        mockWorkerMachineFind.mockResolvedValue([])
        mockCheckDatabaseHealth.mockResolvedValue(true)
        mockGetReleaseHealth.mockReturnValue({
            current: '0.90.0',
            workers: { total: 0, versionMismatched: 0, mismatchedVersions: [] },
        })
    })

    describe('reportAllPlatforms', () => {
        it('should emit a TOTAL_RUNS_PER_DAY billing event per licensed platform keyed by its license key', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('total_runs_per_day')).toHaveLength(1)
            expect(mockCaptureLicenseKeyEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    licenseKey: 'key-123',
                    event: 'total_runs_per_day',
                }),
            )
        })

        it('should skip the heavy aggregate queries and send nothing when no platform has a license key', async () => {
            mockQueries({ licenseKeys: [] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(mockGetRawMany).toHaveBeenCalledTimes(1)
            expect(mockCaptureLicenseKeyEvent).not.toHaveBeenCalled()
        })

        it('should build the event properties with per-day executions and no key_value field', async () => {
            mockQueries({
                activeFlows: [{ platformId: 'platform-1', count: '5' }],
                users: [{ platformId: 'platform-1', count: '10' }],
                projects: [{ platformId: 'platform-1', count: '3' }],
                executionProjects: [{ projectId: 'project-1', platformId: 'platform-1' }],
                executionRuns: [
                    { projectId: 'project-1', runDay: '2026-06-13', runCount: '40' },
                    { projectId: 'project-1', runDay: '2026-06-14', runCount: '60' },
                ],
                licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }],
            })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const properties = capturesOf('total_runs_per_day')[0].properties
            expect(properties).toEqual(expect.objectContaining({
                platform_id: 'platform-1',
                active_flows: 5,
                users: 10,
                projects: 3,
                daily_executions: [
                    { date: '2026-06-13', count: 40 },
                    { date: '2026-06-14', count: 60 },
                ],
            }))
            expect(properties.executions).toBeUndefined()
            expect(properties.key_value).toBeUndefined()
            expect(properties.reported_at).toBeDefined()
        })

        it('should sum runs across multiple projects of the same platform per day, keeping platforms separate', async () => {
            mockQueries({
                licenseKeys: [
                    { platformId: 'platform-1', licenseKey: 'key-1' },
                    { platformId: 'platform-2', licenseKey: 'key-2' },
                ],
                executionProjects: [
                    { projectId: 'p1a', platformId: 'platform-1' },
                    { projectId: 'p1b', platformId: 'platform-1' },
                    { projectId: 'p2a', platformId: 'platform-2' },
                ],
                executionRuns: [
                    { projectId: 'p1a', runDay: '2026-06-13', runCount: '10' },
                    { projectId: 'p1b', runDay: '2026-06-13', runCount: '15' },
                    { projectId: 'p2a', runDay: '2026-06-13', runCount: '7' },
                ],
            })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            // Events are emitted in platform insertion order: platform-1 then platform-2.
            const [first, second] = capturesOf('total_runs_per_day')

            expect(first.licenseKey).toBe('key-1')
            expect(first.properties.platform_id).toBe('platform-1')
            expect(first.properties.daily_executions).toEqual([{ date: '2026-06-13', count: 25 }])

            expect(second.licenseKey).toBe('key-2')
            expect(second.properties.platform_id).toBe('platform-2')
            expect(second.properties.daily_executions).toEqual([{ date: '2026-06-13', count: 7 }])
        })

        it('should default gauges to zero and send empty daily executions when a platform has no usage', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const properties = capturesOf('total_runs_per_day')[0].properties
            expect(properties).toEqual(expect.objectContaining({
                platform_id: 'platform-1',
                active_flows: 0,
                users: 0,
                projects: 0,
                daily_executions: [],
            }))
        })

        it('should flush captured billing events after emitting so nothing is left buffered/dropped', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(mockFlushBillingEvents).toHaveBeenCalledTimes(1)
            const lastCaptureOrder = Math.max(...mockCaptureLicenseKeyEvent.mock.invocationCallOrder)
            const flushOrder = mockFlushBillingEvents.mock.invocationCallOrder[0]
            expect(flushOrder).toBeGreaterThan(lastCaptureOrder)
        })

        it('should emit in bounded batches and flush after each, so buffering never scales with platform count', async () => {
            mockQueries({
                licenseKeys: [
                    { platformId: 'platform-1', licenseKey: 'key-1' },
                    { platformId: 'platform-2', licenseKey: 'key-2' },
                    { platformId: 'platform-3', licenseKey: 'key-3' },
                ],
            })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('total_runs_per_day')).toHaveLength(3)
            expect(capturesOf('platform_setup_report')).toHaveLength(3)
            expect(mockFlushBillingEvents).toHaveBeenCalledTimes(2)
        })

        it('should log and continue rather than abort when a batch flush fails', async () => {
            mockFlushBillingEvents.mockRejectedValueOnce(new Error('posthog flush failed'))
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('total_runs_per_day')).toHaveLength(1)
            expect(mockExceptionHandle).not.toHaveBeenCalled()
        })

        it('should emit a PLATFORM_SETUP_REPORT event alongside the usage event, keyed by the same license key', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const setupReports = capturesOf('platform_setup_report')
            expect(setupReports).toHaveLength(1)
            expect(setupReports[0].licenseKey).toBe('key-123')
            expect(setupReports[0].properties).toEqual(expect.objectContaining({
                platformId: 'platform-1',
                edition: 'ee',
                reportedAt: expect.any(String),
            }))
        })

        it('should stamp every setup report in a run with the same reportedAt as the usage events', async () => {
            mockQueries({
                licenseKeys: [
                    { platformId: 'platform-1', licenseKey: 'key-1' },
                    { platformId: 'platform-2', licenseKey: 'key-2' },
                ],
            })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const usageStamps = capturesOf('total_runs_per_day').map((capture) => capture.properties.reported_at)
            const setupStamps = capturesOf('platform_setup_report').map((capture) => capture.properties.reportedAt)
            expect(new Set([...usageStamps, ...setupStamps]).size).toBe(1)
        })

        it('should report the app replicas with real quantities and without host identifiers', async () => {
            mockAppMachineList.mockResolvedValue([appInstance()])
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const { apps } = capturesOf('platform_setup_report')[0].properties
            expect(apps).toEqual([{
                cpuCores: 4,
                ramTotalBytes: 8_589_934_592,
                diskTotalBytes: 536_870_912_000,
                diskPercentage: 55,
                version: '0.90.0',
                eventLoopDelayMs: 3,
            }])
            expect(apps[0].hostname).toBeUndefined()
        })

        it('should report the worker specs and config without the host ip', async () => {
            mockWorkerMachineFind.mockResolvedValue([workerMachine()])
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const { workers, workersTotal } = capturesOf('platform_setup_report')[0].properties
            expect(workersTotal).toBe(1)
            expect(workers).toEqual([{
                totalCpuCores: 2,
                totalAvailableRamInBytes: 2_147_483_648,
                diskInfo: { total: 107_374_182_400, free: 50_000_000_000, used: 57_374_182_400, percentage: 53 },
                workerProps: {
                    version: '0.90.0',
                    EXECUTION_MODE: 'SANDBOX_CODE_ONLY',
                    WORKER_CONCURRENCY: '1',
                    SANDBOX_MEMORY_LIMIT: '1048576',
                    REUSE_SANDBOX: 'true',
                },
            }])
            expect(workers[0].ip).toBeUndefined()
            expect(workers[0].workerId).toBeUndefined()
        })

        it('should exclude offline workers from the report', async () => {
            const staleUpdated = new Date(Date.now() - 5 * 60 * 1000).toISOString()
            mockWorkerMachineFind.mockResolvedValue([workerMachine(), workerMachine({ id: 'worker-2', updated: staleUpdated })])
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('platform_setup_report')[0].properties.workersTotal).toBe(1)
        })

        it('should cap the worker rows at 50 while still reporting the true fleet size', async () => {
            mockWorkerMachineFind.mockResolvedValue(
                Array.from({ length: 64 }, (_, index) => workerMachine({ id: `worker-${index}` })),
            )
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const { workers, workersTotal } = capturesOf('platform_setup_report')[0].properties
            expect(workers).toHaveLength(50)
            expect(workersTotal).toBe(64)
        })

        it('should report the health checks with the release skew', async () => {
            mockCheckDatabaseHealth.mockResolvedValue(false)
            mockGetReleaseHealth.mockReturnValue({
                current: '0.90.0',
                workers: { total: 9, versionMismatched: 4, mismatchedVersions: ['0.89.0'] },
            })
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('platform_setup_report')[0].properties.health).toEqual({
                database: false,
                release: {
                    current: '0.90.0',
                    workers: { total: 9, versionMismatched: 4, mismatchedVersions: ['0.89.0'] },
                },
            })
        })

        it('should report edition only on cloud when the platform owns no dedicated worker group', async () => {
            mockGetEdition.mockReturnValue('cloud')
            mockWorkerMachineFind.mockResolvedValue([workerMachine()])
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('platform_setup_report')[0].properties).toEqual({
                platformId: 'platform-1',
                edition: 'cloud',
                reportedAt: expect.any(String),
            })
            expect(mockAppMachineList).not.toHaveBeenCalled()
        })

        it('should report only its own dedicated workers on cloud when the platform owns a worker group', async () => {
            mockGetEdition.mockReturnValue('cloud')
            mockWorkerMachineFind.mockResolvedValue([
                workerMachine({ id: 'shared-worker' }),
                workerMachine({ id: 'mine', workerGroupScope: 'platform', workerGroupId: 'group-1' }),
                workerMachine({ id: 'theirs', workerGroupScope: 'platform', workerGroupId: 'group-2' }),
            ])
            mockGetRawMany
                .mockResolvedValueOnce([{ platformId: 'platform-1', licenseKey: 'key-123' }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ platformId: 'platform-1', workerGroupId: 'group-1' }])

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const { workers, workersTotal, apps, health } = capturesOf('platform_setup_report')[0].properties
            expect(workersTotal).toBe(1)
            expect(workers).toHaveLength(1)
            expect(apps).toBeUndefined()
            expect(health).toBeUndefined()
        })

        it('should report an empty dedicated fleet on cloud rather than omitting it, so a downed pool is distinguishable from having no group', async () => {
            mockGetEdition.mockReturnValue('cloud')
            mockWorkerMachineFind.mockResolvedValue([workerMachine({ id: 'shared-worker' })])
            mockGetRawMany
                .mockResolvedValueOnce([{ platformId: 'platform-1', licenseKey: 'key-123' }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ platformId: 'platform-1', workerGroupId: 'group-1' }])

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            const { workers, workersTotal } = capturesOf('platform_setup_report')[0].properties
            expect(workers).toEqual([])
            expect(workersTotal).toBe(0)
        })

        it('should collect the deployment setup once per run, not once per platform', async () => {
            mockAppMachineList.mockResolvedValue([appInstance()])
            mockQueries({
                licenseKeys: [
                    { platformId: 'platform-1', licenseKey: 'key-1' },
                    { platformId: 'platform-2', licenseKey: 'key-2' },
                    { platformId: 'platform-3', licenseKey: 'key-3' },
                ],
            })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('platform_setup_report')).toHaveLength(3)
            expect(mockAppMachineList).toHaveBeenCalledTimes(1)
            expect(mockWorkerMachineFind).toHaveBeenCalledTimes(1)
            expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1)
        })

        it('should still emit the usage event when collecting the setup fails', async () => {
            mockWorkerMachineFind.mockRejectedValue(new Error('redis is down'))
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('total_runs_per_day')).toHaveLength(1)
            expect(capturesOf('platform_setup_report')[0].properties).toEqual({
                platformId: 'platform-1',
                edition: 'ee',
                reportedAt: expect.any(String),
            })
            expect(mockExceptionHandle).not.toHaveBeenCalled()
        })

        it('should send no setup report when no platform has a license key', async () => {
            mockQueries({ licenseKeys: [] })

            await licenseKeyUsageReportService(mockLog).reportAllPlatforms()

            expect(capturesOf('platform_setup_report')).toHaveLength(0)
        })
    })
})
