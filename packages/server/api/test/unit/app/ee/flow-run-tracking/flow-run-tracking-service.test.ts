import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetRawMany,
    mockQueryBuilder,
    mockExceptionHandle,
    mockCaptureBillingEvent,
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
        mockCaptureBillingEvent: vi.fn(),
    }
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
    captureBillingEvent: mockCaptureBillingEvent,
    BillingEvents: {
        AI_USAGE_PER_RUN: 'ai_usage_per_run',
        CHAT_MESSAGE: 'chat_message',
        TOTAL_RUNS_PER_DAY: 'total_runs_per_day',
    },
}))

import { flowRunTrackingService } from '../../../../../src/app/ee/flow-run-tracking/flow-run-tracking-service'

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
} as unknown as Parameters<typeof flowRunTrackingService>[0]

// License keys are queried first (and gate the rest); the scoped count queries run afterwards in
// declaration order: active flows, users, team projects, then per-day executions — which itself runs
// two queries: a project->platform lookup followed by the flow_run aggregate (grouped by projectId).
const mockQueries = ({ licenseKeys = [], activeFlows = [], users = [], projects = [], executionProjects = [], executionRuns = [] }: {
    licenseKeys?: { platformId: string, licenseKey: string }[]
    activeFlows?: { platformId: string, count: string }[]
    users?: { platformId: string, count: string }[]
    projects?: { platformId: string, count: string }[]
    executionProjects?: { projectId: string, platformId: string }[]
    executionRuns?: { projectId: string, day: string, count: string }[]
}): void => {
    mockGetRawMany
        .mockResolvedValueOnce(licenseKeys)
        .mockResolvedValueOnce(activeFlows)
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce(projects)
        .mockResolvedValueOnce(executionProjects)
        .mockResolvedValueOnce(executionRuns)
}

describe('flowRunTrackingService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetRawMany.mockReset().mockResolvedValue([])
    })

    describe('reportAllPlatforms', () => {
        it('should emit a TOTAL_RUNS_PER_DAY billing event per licensed platform keyed by its license key', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await flowRunTrackingService(mockLog).reportAllPlatforms()

            expect(mockCaptureBillingEvent).toHaveBeenCalledTimes(1)
            expect(mockCaptureBillingEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    licenseKey: 'key-123',
                    event: 'total_runs_per_day',
                }),
            )
        })

        it('should skip the heavy aggregate queries and send nothing when no platform has a license key', async () => {
            mockQueries({ licenseKeys: [] })

            await flowRunTrackingService(mockLog).reportAllPlatforms()

            expect(mockGetRawMany).toHaveBeenCalledTimes(1)
            expect(mockCaptureBillingEvent).not.toHaveBeenCalled()
        })

        it('should build the event properties with per-day executions and no key_value field', async () => {
            mockQueries({
                activeFlows: [{ platformId: 'platform-1', count: '5' }],
                users: [{ platformId: 'platform-1', count: '10' }],
                projects: [{ platformId: 'platform-1', count: '3' }],
                executionProjects: [{ projectId: 'project-1', platformId: 'platform-1' }],
                executionRuns: [
                    { projectId: 'project-1', day: '2026-06-13', count: '40' },
                    { projectId: 'project-1', day: '2026-06-14', count: '60' },
                ],
                licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }],
            })

            await flowRunTrackingService(mockLog).reportAllPlatforms()

            const properties = mockCaptureBillingEvent.mock.calls[0][0].properties
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
                    { projectId: 'p1a', day: '2026-06-13', count: '10' },
                    { projectId: 'p1b', day: '2026-06-13', count: '15' },
                    { projectId: 'p2a', day: '2026-06-13', count: '7' },
                ],
            })

            await flowRunTrackingService(mockLog).reportAllPlatforms()

            // Events are emitted in platform insertion order: platform-1 then platform-2.
            const first = mockCaptureBillingEvent.mock.calls[0][0]
            const second = mockCaptureBillingEvent.mock.calls[1][0]

            expect(first.licenseKey).toBe('key-1')
            expect(first.properties.platform_id).toBe('platform-1')
            expect(first.properties.daily_executions).toEqual([{ date: '2026-06-13', count: 25 }])

            expect(second.licenseKey).toBe('key-2')
            expect(second.properties.platform_id).toBe('platform-2')
            expect(second.properties.daily_executions).toEqual([{ date: '2026-06-13', count: 7 }])
        })

        it('should default gauges to zero and send empty daily executions when a platform has no usage', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await flowRunTrackingService(mockLog).reportAllPlatforms()

            const properties = mockCaptureBillingEvent.mock.calls[0][0].properties
            expect(properties).toEqual(expect.objectContaining({
                platform_id: 'platform-1',
                active_flows: 0,
                users: 0,
                projects: 0,
                daily_executions: [],
            }))
        })
    })
})
