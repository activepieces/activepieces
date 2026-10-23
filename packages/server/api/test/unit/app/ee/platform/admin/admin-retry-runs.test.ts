import { FlowRetryStrategy, FlowRun } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminPlatformService } from '../../../../../../src/app/ee/platform/admin/admin-platform.service'

const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue([]),
}

const mockFlowRunRepo = {
    createQueryBuilder: vi.fn(() => mockQueryBuilder),
}

const mockBulkRetry = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunRepo: () => mockFlowRunRepo,
    flowRunService: () => ({
        bulkRetry: mockBulkRetry,
    }),
}))

const mockLog = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
} as unknown as FastifyBaseLogger

describe('adminPlatformService.retryRuns', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockQueryBuilder.andWhere.mockReturnThis()
        mockQueryBuilder.getMany.mockResolvedValue([])
    })

    it('should query date range when runIds is omitted and bulk retry grouped runs', async () => {
        const mockRuns: Partial<FlowRun>[] = [
            { id: 'run-1', projectId: 'project-1' },
            { id: 'run-2', projectId: 'project-1' },
            { id: 'run-3', projectId: 'project-2' },
        ]
        mockQueryBuilder.getMany.mockResolvedValueOnce(mockRuns)

        const service = adminPlatformService(mockLog)
        await service.retryRuns({
            createdAfter: '2026-10-01T00:00:00.000Z',
            createdBefore: '2026-10-20T00:00:00.000Z',
        })

        expect(mockFlowRunRepo.createQueryBuilder).toHaveBeenCalledWith('flow_run')
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'flow_run.created <= :createdBefore',
            { createdBefore: '2026-10-20T00:00:00.000Z' },
        )
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'flow_run.created >= :createdAfter',
            { createdAfter: '2026-10-01T00:00:00.000Z' },
        )
        expect(mockBulkRetry).toHaveBeenCalledTimes(2)
        expect(mockBulkRetry).toHaveBeenCalledWith({
            projectId: 'project-1',
            flowRunIds: ['run-1', 'run-2'],
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
        })
        expect(mockBulkRetry).toHaveBeenCalledWith({
            projectId: 'project-2',
            flowRunIds: ['run-3'],
            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
        })
    })

    it('should intersect explicit runIds with date range filters', async () => {
        const service = adminPlatformService(mockLog)
        await service.retryRuns({
            runIds: ['run-a', 'run-b'],
            createdAfter: '2026-10-10T00:00:00.000Z',
            createdBefore: '2026-10-15T00:00:00.000Z',
        })

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'flow_run.id IN (:...runIds)',
            { runIds: ['run-a', 'run-b'] },
        )
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'flow_run.created <= :createdBefore',
            { createdBefore: '2026-10-15T00:00:00.000Z' },
        )
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'flow_run.created >= :createdAfter',
            { createdAfter: '2026-10-10T00:00:00.000Z' },
        )
    })

    it('should short-circuit when runIds is an explicit empty array', async () => {
        const service = adminPlatformService(mockLog)
        await service.retryRuns({
            runIds: [],
            createdAfter: '2026-10-10T00:00:00.000Z',
            createdBefore: '2026-10-15T00:00:00.000Z',
        })

        expect(mockQueryBuilder.getMany).not.toHaveBeenCalled()
        expect(mockBulkRetry).not.toHaveBeenCalled()
    })
})
