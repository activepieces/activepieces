import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jobQueue } from '../../../../../src/app/workers/job-queue/job-queue'

const queueState = vi.hoisted(() => ({
    queuedJobIds: [] as string[],
    loadedJobIds: [] as string[],
    removedJobIds: [] as string[],
    lockedJobIds: new Set<string>(),
}))

vi.mock('bullmq', () => {
    class FakeQueue {
        async removeGlobalConcurrency(): Promise<void> {
            return undefined
        }

        async waitUntilReady(): Promise<void> {
            return undefined
        }

        async getRanges(): Promise<string[]> {
            return queueState.queuedJobIds
        }

        async getJobs(): Promise<FakeJob[]> {
            return queueState.queuedJobIds.map(loadJob)
        }

        async getJob(jobId: string): Promise<FakeJob | undefined> {
            return queueState.queuedJobIds.includes(jobId) ? loadJob(jobId) : undefined
        }

        async remove(jobId: string): Promise<number> {
            if (queueState.lockedJobIds.has(jobId)) {
                return 0
            }
            queueState.removedJobIds.push(jobId)
            return 1
        }
    }
    function loadJob(jobId: string): FakeJob {
        queueState.loadedJobIds.push(jobId)
        return {
            id: jobId,
            remove: async (): Promise<void> => {
                if (queueState.lockedJobIds.has(jobId)) {
                    throw new Error(`Job ${jobId} could not be removed because it is locked by another worker`)
                }
                queueState.removedJobIds.push(jobId)
            },
        }
    }
    type FakeJob = { id: string, remove: () => Promise<void> }
    return { Queue: FakeQueue }
})

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    redisConnections: { create: vi.fn(async () => ({})) },
}))

vi.mock('../../../../../src/app/workers/worker-groups/worker-group-routing', () => ({
    workerGroupRouting: { resolveQueueForJob: vi.fn(async () => 'workerJobs') },
}))

const clearMany = vi.fn(async () => undefined)
vi.mock('../../../../../src/app/workers/job-queue/job-reclaim-count', () => ({
    jobReclaimCount: { clearMany: (...args: unknown[]): Promise<undefined> => clearMany(...args) },
}))

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

const FLOW_RUN_ID = 'cancelledRunId0000001'
const OTHER_JOB_IDS = Array.from({ length: 1000 }, (_, i) => `otherRun${String(i).padStart(13, '0')}`)

describe('jobQueue.removeAllFlowRunJobs', () => {
    beforeEach(() => {
        queueState.loadedJobIds = []
        queueState.removedJobIds = []
        queueState.lockedJobIds = new Set()
        queueState.queuedJobIds = [
            ...OTHER_JOB_IDS,
            FLOW_RUN_ID,
            `${FLOW_RUN_ID}-resume-waitpoint00000000001`,
        ]
        clearMany.mockClear()
    })

    it('loads only the cancelled run\'s jobs, not every queued job', async () => {
        await jobQueue(mockLog).removeAllFlowRunJobs({ flowRunId: FLOW_RUN_ID, platformId: 'platform', projectId: 'project', flowId: 'flow' })

        expect(queueState.loadedJobIds.filter((jobId) => !jobId.startsWith(FLOW_RUN_ID))).toEqual([])
        expect(queueState.removedJobIds.sort()).toEqual([FLOW_RUN_ID, `${FLOW_RUN_ID}-resume-waitpoint00000000001`].sort())
        expect(clearMany).toHaveBeenCalledWith(expect.objectContaining({ jobIds: expect.arrayContaining([FLOW_RUN_ID, `${FLOW_RUN_ID}-resume-waitpoint00000000001`]) }))
    })

    it('skips a job a worker holds and still removes the rest', async () => {
        queueState.lockedJobIds = new Set([FLOW_RUN_ID])

        await jobQueue(mockLog).removeAllFlowRunJobs({ flowRunId: FLOW_RUN_ID, platformId: 'platform', projectId: 'project', flowId: 'flow' })

        expect(queueState.removedJobIds).toEqual([`${FLOW_RUN_ID}-resume-waitpoint00000000001`])
        expect(clearMany).toHaveBeenCalledWith(expect.objectContaining({ jobIds: [`${FLOW_RUN_ID}-resume-waitpoint00000000001`] }))
    })
})
