import { ExecuteFlowJobData, ExecutionType, FlowTriggerType, PollingJobData, RenewWebhookJobData, RunEnvironment, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { projectInactiveInterceptor } from '../../../../../../src/app/workers/job-queue/interceptors/project-inactive-interceptor'
import { InterceptorVerdict } from '../../../../../../src/app/workers/job-queue/job-interceptor'

const isInactive = vi.fn()

vi.mock('../../../../../../src/app/project/project-status.service', () => ({
    projectStatusService: () => ({ isInactive }),
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

const PROJECT_ID = 'proj-inactive-interceptor'
const mockJob = { attemptsMade: 0 } as unknown as Job

const pollingJobData: PollingJobData = {
    jobType: WorkerJobType.EXECUTE_POLLING,
    projectId: PROJECT_ID,
    platformId: 'plat-1',
    schemaVersion: 4,
    flowVersionId: 'fv-1',
    flowId: 'flow-1',
    triggerType: FlowTriggerType.PIECE,
}

const renewWebhookJobData: RenewWebhookJobData = {
    jobType: WorkerJobType.RENEW_WEBHOOK,
    projectId: PROJECT_ID,
    platformId: 'plat-1',
    schemaVersion: 4,
    flowVersionId: 'fv-1',
    flowId: 'flow-1',
}

const flowJobData: ExecuteFlowJobData = {
    jobType: WorkerJobType.EXECUTE_FLOW,
    environment: RunEnvironment.PRODUCTION,
    projectId: PROJECT_ID,
    platformId: 'plat-1',
    schemaVersion: 4,
    flowId: 'flow-1',
    flowVersionId: 'fv-1',
    runId: 'run-1',
    executionType: ExecutionType.BEGIN,
    streamStepProgress: StreamStepProgress.NONE,
    payload: { type: 'inline', value: {} },
}

describe('projectInactiveInterceptor', () => {
    beforeEach(() => {
        isInactive.mockReset()
    })

    it('discards a polling job when the project is inactive', async () => {
        isInactive.mockResolvedValue(true)

        const result = await projectInactiveInterceptor.preDispatch({
            jobId: 'job-1',
            jobData: pollingJobData,
            job: mockJob,
            log: mockLog,
        })

        expect(result.verdict).toBe(InterceptorVerdict.DISCARD)
        expect(isInactive).toHaveBeenCalledWith({ projectId: PROJECT_ID })
    })

    it('allows a polling job when the project is active', async () => {
        isInactive.mockResolvedValue(false)

        const result = await projectInactiveInterceptor.preDispatch({
            jobId: 'job-1',
            jobData: pollingJobData,
            job: mockJob,
            log: mockLog,
        })

        expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
    })

    it('always allows renew-webhook jobs so external registrations do not expire', async () => {
        isInactive.mockResolvedValue(true)

        const result = await projectInactiveInterceptor.preDispatch({
            jobId: 'job-1',
            jobData: renewWebhookJobData,
            job: mockJob,
            log: mockLog,
        })

        expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
        expect(isInactive).not.toHaveBeenCalled()
    })

    it('does not hold flow jobs that were queued while the project was still active', async () => {
        isInactive.mockResolvedValue(true)

        const result = await projectInactiveInterceptor.preDispatch({
            jobId: 'job-1',
            jobData: flowJobData,
            job: mockJob,
            log: mockLog,
        })

        expect(result.verdict).toBe(InterceptorVerdict.ALLOW)
        expect(isInactive).not.toHaveBeenCalled()
    })
})
