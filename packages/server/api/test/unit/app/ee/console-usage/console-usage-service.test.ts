import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetRawMany,
    mockQueryBuilder,
    mockExceptionHandle,
    mockFetch,
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
        mockFetch: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    }
})

vi.stubGlobal('fetch', mockFetch)

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

import { consoleUsageService } from '../../../../../src/app/ee/console-usage/console-usage-service'

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

const SNAPSHOT_URL = 'https://console.activepieces.com/api/external/usage/snapshot'

// License keys are queried first (and gate the rest); the four scoped count queries run afterwards
// in declaration order: active flows, users, team projects, per-day executions.
const mockQueries = ({ licenseKeys = [], activeFlows = [], users = [], projects = [], dailyExecutions = [] }: {
    licenseKeys?: { platformId: string, licenseKey: string }[]
    activeFlows?: { platformId: string, count: string }[]
    users?: { platformId: string, count: string }[]
    projects?: { platformId: string, count: string }[]
    dailyExecutions?: { platformId: string, day: string, count: string }[]
}): void => {
    mockGetRawMany
        .mockResolvedValueOnce(licenseKeys)
        .mockResolvedValueOnce(activeFlows)
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce(projects)
        .mockResolvedValueOnce(dailyExecutions)
}

describe('consoleUsageService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset().mockResolvedValue({ ok: true, status: 200 })
        mockGetRawMany.mockReset().mockResolvedValue([])
    })

    describe('reportAllPlatforms', () => {
        it('should report each license-keyed platform with the license key as the bearer token', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockFetch).toHaveBeenCalledTimes(1)
            expect(mockFetch).toHaveBeenCalledWith(
                SNAPSHOT_URL,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer key-123',
                    }),
                }),
            )
        })

        it('should skip the heavy aggregate queries and send nothing when no platform has a license key', async () => {
            mockQueries({ licenseKeys: [] })

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockGetRawMany).toHaveBeenCalledTimes(1)
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should build the snapshot body with per-day executions and no key_value field', async () => {
            mockQueries({
                activeFlows: [{ platformId: 'platform-1', count: '5' }],
                users: [{ platformId: 'platform-1', count: '10' }],
                projects: [{ platformId: 'platform-1', count: '3' }],
                dailyExecutions: [
                    { platformId: 'platform-1', day: '2026-06-13', count: '40' },
                    { platformId: 'platform-1', day: '2026-06-14', count: '60' },
                ],
                licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }],
            })

            await consoleUsageService(mockLog).reportAllPlatforms()

            const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(fetchBody).toEqual(expect.objectContaining({
                platform_id: 'platform-1',
                active_flows: 5,
                users: 10,
                projects: 3,
                daily_executions: [
                    { date: '2026-06-13', count: 40 },
                    { date: '2026-06-14', count: 60 },
                ],
            }))
            expect(fetchBody.executions).toBeUndefined()
            expect(fetchBody.key_value).toBeUndefined()
            expect(fetchBody.reported_at).toBeDefined()
        })

        it('should default gauges to zero and send empty daily executions when a platform has no usage', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })

            await consoleUsageService(mockLog).reportAllPlatforms()

            const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(fetchBody.active_flows).toBe(0)
            expect(fetchBody.users).toBe(0)
            expect(fetchBody.projects).toBe(0)
            expect(fetchBody.daily_executions).toEqual([])
        })

        it('should backfill one snapshot per day across the from/to range, dated on each day', async () => {
            mockQueries({
                activeFlows: [{ platformId: 'p1', count: '5' }],
                users: [{ platformId: 'p1', count: '10' }],
                projects: [{ platformId: 'p1', count: '3' }],
                dailyExecutions: [
                    { platformId: 'p1', day: '2026-06-07', count: '40' },
                    { platformId: 'p1', day: '2026-06-09', count: '70' },
                ],
                licenseKeys: [{ platformId: 'p1', licenseKey: 'key-123' }],
            })

            await consoleUsageService(mockLog).reportAllPlatforms({ from: '2026-06-07', to: '2026-06-09' })

            expect(mockFetch).toHaveBeenCalledTimes(3)
            const byDate = new Map(
                mockFetch.mock.calls
                    .map((call) => JSON.parse(call[1].body))
                    .map((body) => [body.daily_executions[0].date, body]),
            )

            expect([...byDate.keys()].sort()).toEqual(['2026-06-07', '2026-06-08', '2026-06-09'])

            // Each snapshot is stamped on its own UTC day and carries that day's count (0 with no runs).
            expect(byDate.get('2026-06-07').daily_executions).toEqual([{ date: '2026-06-07', count: 40 }])
            expect(byDate.get('2026-06-07').reported_at).toBe('2026-06-07T12:00:00.000Z')
            expect(byDate.get('2026-06-08').daily_executions).toEqual([{ date: '2026-06-08', count: 0 }])
            expect(byDate.get('2026-06-09').daily_executions).toEqual([{ date: '2026-06-09', count: 70 }])

            // Gauges have no history, so every backfilled day carries the current reading.
            expect(byDate.get('2026-06-08').active_flows).toBe(5)
            expect(byDate.get('2026-06-08').users).toBe(10)
            expect(byDate.get('2026-06-08').projects).toBe(3)
        })

        it('should handle fetch errors per platform without stopping others', async () => {
            mockQueries({
                licenseKeys: [
                    { platformId: 'p1', licenseKey: 'k1' },
                    { platformId: 'p2', licenseKey: 'k2' },
                ],
            })

            mockFetch
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce({ ok: true, status: 200 })

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockFetch).toHaveBeenCalledTimes(2)
            expect(mockExceptionHandle).toHaveBeenCalledTimes(1)
        })

        it('should handle non-ok HTTP responses as errors', async () => {
            mockQueries({ licenseKeys: [{ platformId: 'platform-1', licenseKey: 'key-123' }] })
            mockFetch.mockResolvedValue({ ok: false, status: 500 })

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockExceptionHandle).toHaveBeenCalledTimes(1)
        })
    })
})
