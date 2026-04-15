import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetRawMany,
    mockQueryBuilder,
    mockGetAll,
    mockGetOne,
    mockExceptionHandle,
    mockFetch,
    mockRejectedPromiseHandler,
} = vi.hoisted(() => {
    const mockGetRawMany = vi.fn()
    const mockQueryBuilder = {
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: mockGetRawMany,
    }
    return {
        mockGetRawMany,
        mockQueryBuilder,
        mockGetAll: vi.fn(),
        mockGetOne: vi.fn(),
        mockExceptionHandle: vi.fn(),
        mockFetch: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
        mockRejectedPromiseHandler: vi.fn(),
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

vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformService: vi.fn(() => ({
        getAll: mockGetAll,
        getOne: mockGetOne,
    })),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: vi.fn().mockReturnValue('test-console-api-key'),
        getEdition: vi.fn().mockReturnValue(ApEdition.CLOUD),
        getBoolean: vi.fn().mockReturnValue(true),
        getOrThrow: vi.fn().mockReturnValue(ApEnvironment.PRODUCTION),
    },
}))

vi.mock('../../../../../src/app/helper/exception-handler', () => ({
    exceptionHandler: {
        handle: mockExceptionHandle,
    },
}))

vi.mock('../../../../../src/app/helper/promise-handler', () => ({
    rejectedPromiseHandler: mockRejectedPromiseHandler,
}))

import { consoleUsageService } from '../../../../../src/app/ee/console-usage/console-usage-service'
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

describe('consoleUsageService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockResolvedValue({ ok: true, status: 200 })
        mockGetRawMany.mockResolvedValue([])
        mockGetAll.mockResolvedValue([])
    })

    describe('reportAllPlatforms', () => {
        it('should skip when non-cloud and telemetry is disabled', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.ENTERPRISE)
            vi.mocked(system.getBoolean).mockReturnValue(false)

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockGetAll).not.toHaveBeenCalled()
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should proceed when non-cloud and telemetry is enabled', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.ENTERPRISE)
            vi.mocked(system.getBoolean).mockReturnValue(true)
            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockGetAll).toHaveBeenCalled()
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })

        it('should send to console API with auth header when API key is set', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockFetch).toHaveBeenCalledWith(
                'https://console.activepieces.com/api/external/usage/snapshot',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-console-api-key',
                    }),
                }),
            )
        })

        it('should send to cloud relay when no API key is configured', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.ENTERPRISE)
            vi.mocked(system.getBoolean).mockReturnValue(true)
            vi.mocked(system.get).mockReturnValue(undefined as unknown as string)

            vi.resetModules()
            const { consoleUsageService: freshService } = await import(
                '../../../../../src/app/ee/console-usage/console-usage-service'
            )

            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])

            await freshService(mockLog).reportAllPlatforms()

            expect(mockFetch).toHaveBeenCalledWith(
                'https://cloud.activepieces.com/api/v1/console-usage/snapshots',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }),
            )
        })

        it('should build correct snapshot body with license key', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])

            mockGetRawMany
                .mockResolvedValueOnce([{ platformId: 'platform-1', count: '5' }])
                .mockResolvedValueOnce([{ platformId: 'platform-1', count: '10' }])
                .mockResolvedValueOnce([{ platformId: 'platform-1', count: '3' }])
                .mockResolvedValueOnce([{ platformId: 'platform-1', count: '100' }])
                .mockResolvedValueOnce([{ platformId: 'platform-1', licenseKey: 'key-123' }])

            await consoleUsageService(mockLog).reportAllPlatforms()

            const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(fetchBody).toEqual(expect.objectContaining({
                platform_id: 'platform-1',
                active_flows: 5,
                users: 10,
                projects: 3,
                executions: 100,
                key_value: 'key-123',
            }))
            expect(fetchBody.reported_at).toBeDefined()
        })

        it('should not include key_value when no license key', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])
            mockGetRawMany.mockResolvedValue([])

            await consoleUsageService(mockLog).reportAllPlatforms()

            const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(fetchBody.key_value).toBeUndefined()
        })

        it('should handle fetch errors per platform without stopping others', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetAll.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }])
            mockGetRawMany.mockResolvedValue([])

            mockFetch
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce({ ok: true, status: 200 })

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockExceptionHandle).toHaveBeenCalledTimes(1)
            expect(mockFetch).toHaveBeenCalledTimes(2)
        })

        it('should handle non-ok HTTP responses as errors', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])
            mockGetRawMany.mockResolvedValue([])
            mockFetch.mockResolvedValue({ ok: false, status: 500 })

            await consoleUsageService(mockLog).reportAllPlatforms()

            expect(mockExceptionHandle).toHaveBeenCalledTimes(1)
        })

        it('should default to zero for platforms with no query results', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetAll.mockResolvedValue([{ id: 'platform-1' }])
            mockGetRawMany.mockResolvedValue([])

            await consoleUsageService(mockLog).reportAllPlatforms()

            const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(fetchBody.active_flows).toBe(0)
            expect(fetchBody.users).toBe(0)
            expect(fetchBody.projects).toBe(0)
            expect(fetchBody.executions).toBe(0)
        })

        it('should skip on cloud when API key is missing', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            vi.mocked(system.get).mockReturnValue(undefined as unknown as string)

            vi.resetModules()
            const { consoleUsageService: freshService } = await import(
                '../../../../../src/app/ee/console-usage/console-usage-service'
            )

            await freshService(mockLog).reportAllPlatforms()

            expect(mockGetAll).not.toHaveBeenCalled()
            expect(mockFetch).not.toHaveBeenCalled()
        })
    })

    describe('processRelayedSnapshot', () => {
        it('should skip when not cloud edition', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.ENTERPRISE)

            await consoleUsageService(mockLog).processRelayedSnapshot({
                platformId: 'p1',
                snapshot: { platform_id: 'p1', executions: 0, active_flows: 0, projects: 0, users: 0 },
            })

            expect(mockGetOne).not.toHaveBeenCalled()
            expect(mockRejectedPromiseHandler).not.toHaveBeenCalled()
        })

        it('should skip when platform is unknown', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetOne.mockResolvedValue(null)

            await consoleUsageService(mockLog).processRelayedSnapshot({
                platformId: 'unknown-id',
                snapshot: { platform_id: 'unknown-id', executions: 0, active_flows: 0, projects: 0, users: 0 },
            })

            expect(mockGetOne).toHaveBeenCalledWith('unknown-id')
            expect(mockLog.warn).toHaveBeenCalled()
            expect(mockRejectedPromiseHandler).not.toHaveBeenCalled()
        })

        it('should forward snapshot when cloud and platform exists', async () => {
            vi.mocked(system.getEdition).mockReturnValue(ApEdition.CLOUD)
            mockGetOne.mockResolvedValue({ id: 'p1' })

            const snapshot = { platform_id: 'p1', executions: 50, active_flows: 10, projects: 2, users: 5 }
            await consoleUsageService(mockLog).processRelayedSnapshot({
                platformId: 'p1',
                snapshot,
            })

            expect(mockRejectedPromiseHandler).toHaveBeenCalledWith(
                expect.any(Promise),
                mockLog,
            )
        })
    })
})
