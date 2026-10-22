import { FlowRetryStrategy } from '@activepieces/shared'
import { In } from 'typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminPlatformService } from '../../../../../src/app/ee/platform/admin/admin-platform.service'
import { system } from '../../../../../src/app/helper/system/system'

const mockWhere = vi.fn()
const mockAndWhere = vi.fn()
const mockGetMany = vi.fn()
const mockBulkRetry = vi.fn()
const mockQueryBuilder = {
    where: mockWhere,
    andWhere: mockAndWhere,
    getMany: mockGetMany,
}

vi.mock('../../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunRepo: () => ({
        createQueryBuilder: () => mockQueryBuilder,
    }),
    flowRunService: () => ({
        bulkRetry: mockBulkRetry,
    }),
}))

describe('adminPlatformService.retryRuns', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockWhere.mockReturnValue(mockQueryBuilder)
        mockAndWhere.mockReturnValue(mockQueryBuilder)
    })

    it('selects runs by the required date range when run ids are omitted', async () => {
        mockGetMany.mockResolvedValue([
            { id: 'run-1', projectId: 'project-1' },
            { id: 'run-2', projectId: 'project-1' },
        ])

        await adminPlatformService(system.globalLogger()).retryRuns({
            createdAfter: '2026-10-01T00:00:00.000Z',
            createdBefore: '2026-10-02T00:00:00.000Z',
        })

        expect(mockWhere).toHaveBeenCalledWith('flow_run.created >= :createdAfter', {
            createdAfter: '2026-10-01T00:00:00.000Z',
        })
        expect(mockAndWhere).toHaveBeenCalledOnce()
        expect(mockAndWhere).toHaveBeenCalledWith('flow_run.created <= :createdBefore', {
            createdBefore: '2026-10-02T00:00:00.000Z',
        })
        expect(mockBulkRetry).toHaveBeenCalledWith({
            projectId: 'project-1',
            flowRunIds: ['run-1', 'run-2'],
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
        })
    })

    it('combines explicit run ids with the required date range', async () => {
        const runIds = ['run-1', 'run-2']
        mockGetMany.mockResolvedValue([
            { id: 'run-1', projectId: 'project-1' },
        ])

        await adminPlatformService(system.globalLogger()).retryRuns({
            createdAfter: '2026-10-01T00:00:00.000Z',
            createdBefore: '2026-10-02T00:00:00.000Z',
            runIds,
        })

        expect(mockAndWhere).toHaveBeenNthCalledWith(1, 'flow_run.created <= :createdBefore', {
            createdBefore: '2026-10-02T00:00:00.000Z',
        })
        expect(mockAndWhere).toHaveBeenNthCalledWith(2, {
            id: In(runIds),
        })
        expect(mockBulkRetry).toHaveBeenCalledWith({
            projectId: 'project-1',
            flowRunIds: ['run-1'],
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
        })
    })
})
