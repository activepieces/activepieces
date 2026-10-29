import { WorkerGroupScope, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockIsWorkerGroupsEnabled = vi.fn()
const mockGetPlatformWorkerGroupId = vi.fn()
const mockGetProjectWorkerGroup = vi.fn()
const mockGetFlowWorkerGroup = vi.fn()

vi.mock('../../../../../src/app/workers/worker-groups/platform-worker-group.service', () => ({
    platformWorkerGroupService: () => ({
        isWorkerGroupsEnabled: mockIsWorkerGroupsEnabled,
        getWorkerGroupId: mockGetPlatformWorkerGroupId,
    }),
}))

vi.mock('../../../../../src/app/workers/worker-groups/project-worker-group.service', () => ({
    projectWorkerGroupService: () => ({
        getProjectWorkerGroup: mockGetProjectWorkerGroup,
    }),
}))

vi.mock('../../../../../src/app/workers/worker-groups/flow-worker-group.service', () => ({
    flowWorkerGroupService: () => ({
        getFlowWorkerGroup: mockGetFlowWorkerGroup,
    }),
}))

const mockLog = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger

type WorkerGroupRouting = typeof import('../../../../../src/app/workers/worker-groups/worker-group-routing').workerGroupRouting

async function loadRouting(): Promise<WorkerGroupRouting> {
    const mod = await import('../../../../../src/app/workers/worker-groups/worker-group-routing')
    return mod.workerGroupRouting
}

describe('workerGroupRouting', () => {
    let routing: WorkerGroupRouting

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        mockIsWorkerGroupsEnabled.mockResolvedValue(true)
        mockGetPlatformWorkerGroupId.mockResolvedValue(null)
        mockGetProjectWorkerGroup.mockResolvedValue(null)
        mockGetFlowWorkerGroup.mockResolvedValue(null)
        routing = await loadRouting()
    })

    describe('resolveQueueForJob', () => {
        it('routes to the flow group queue when the flow has a group', async () => {
            mockGetFlowWorkerGroup.mockResolvedValue('g1')
            mockGetProjectWorkerGroup.mockResolvedValue('pg')

            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', flowId: 'f1', jobType: WorkerJobType.EXECUTE_FLOW, log: mockLog })

            expect(queue).toBe('flow-g1-jobs')
        })

        it('falls back to the project group queue when the flow has no group', async () => {
            mockGetProjectWorkerGroup.mockResolvedValue('pg')

            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', flowId: 'f1', jobType: WorkerJobType.EXECUTE_WEBHOOK, log: mockLog })

            expect(queue).toBe('project-pg-jobs')
        })

        it('falls back to the platform group queue when neither flow nor project has a group', async () => {
            mockGetPlatformWorkerGroupId.mockResolvedValue('plg')

            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', flowId: 'f1', jobType: WorkerJobType.EXECUTE_FLOW, log: mockLog })

            expect(queue).toBe('platform-plg-jobs')
        })

        it('falls back to the shared queue when no group applies', async () => {
            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', flowId: 'f1', jobType: WorkerJobType.EXECUTE_FLOW, log: mockLog })

            expect(queue).toBe('workerJobs')
        })

        it('skips flow and project lookups when worker groups are disabled', async () => {
            mockIsWorkerGroupsEnabled.mockResolvedValue(false)
            mockGetFlowWorkerGroup.mockResolvedValue('g1')
            mockGetProjectWorkerGroup.mockResolvedValue('pg')

            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', flowId: 'f1', jobType: WorkerJobType.EXECUTE_FLOW, log: mockLog })

            expect(queue).toBe('workerJobs')
            expect(mockGetFlowWorkerGroup).not.toHaveBeenCalled()
            expect(mockGetProjectWorkerGroup).not.toHaveBeenCalled()
        })

        it('skips flow and project lookups for non-routable job types', async () => {
            mockGetFlowWorkerGroup.mockResolvedValue('g1')

            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', flowId: 'f1', jobType: WorkerJobType.EXECUTE_PROPERTY, log: mockLog })

            expect(queue).toBe('workerJobs')
            expect(mockGetFlowWorkerGroup).not.toHaveBeenCalled()
            expect(mockGetProjectWorkerGroup).not.toHaveBeenCalled()
        })

        it('skips the flow lookup when no flowId is provided', async () => {
            mockGetProjectWorkerGroup.mockResolvedValue('pg')

            const queue = await routing.resolveQueueForJob({ platformId: 'pl1', projectId: 'pr1', jobType: WorkerJobType.EXECUTE_FLOW, log: mockLog })

            expect(queue).toBe('project-pg-jobs')
            expect(mockGetFlowWorkerGroup).not.toHaveBeenCalled()
        })
    })

    describe('resolveQueueForWorker', () => {
        it('routes a shared worker to the shared queue', async () => {
            expect(routing.resolveQueueForWorker(null)).toBe('workerJobs')
        })

        it('routes each scope to its queue family', async () => {
            expect(routing.resolveQueueForWorker({ scope: WorkerGroupScope.FLOW, id: 'g1' })).toBe('flow-g1-jobs')
            expect(routing.resolveQueueForWorker({ scope: WorkerGroupScope.PROJECT, id: 'g1' })).toBe('project-g1-jobs')
            expect(routing.resolveQueueForWorker({ scope: WorkerGroupScope.PLATFORM, id: 'g1' })).toBe('platform-g1-jobs')
        })
    })
})
