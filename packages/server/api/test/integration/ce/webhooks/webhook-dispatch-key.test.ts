import { apId, FlowStatus, PrincipalType } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { jobQueue } from '../../../../src/app/workers/job-queue/job-queue'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createEnabledFlow() {
    const { mockProject, mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
    const mockFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.ENABLED,
    })
    await db.save('flow', [mockFlow])
    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', [mockFlowVersion])
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })
    const mockToken = await generateMockToken({
        type: PrincipalType.USER,
        platform: { id: mockPlatform.id },
        id: mockOwner.id,
    })
    return { mockFlow, mockToken, mockProject }
}

async function dispatch({ flowId, token, dispatchKey, parentWaitpointId, body }: DispatchParams) {
    return app.inject({
        method: 'POST',
        url: `/api/v1/webhooks/${flowId}`,
        headers: {
            authorization: `Bearer ${token}`,
            'ap-parent-run-id': apId(),
            'ap-fail-parent-on-failure': 'false',
            ...(dispatchKey ? { 'ap-dispatch-key': dispatchKey } : {}),
            ...(parentWaitpointId ? { 'ap-parent-waitpoint-id': parentWaitpointId } : {}),
        },
        body,
    })
}

async function findQueuedJobsForFlow(flowId: string): Promise<Job[]> {
    const queues = jobQueue(app.log).getAllQueues()
    const jobsPerQueue = await Promise.all(queues.map((queue) => queue.getJobs(['waiting', 'prioritized', 'delayed', 'active', 'completed', 'failed'])))
    return jobsPerQueue.flat().filter((job) => {
        const data: unknown = job.data
        return typeof data === 'object' && data !== null && 'flowId' in data && data.flowId === flowId
    })
}

describe('Webhook dispatch key', () => {
    it('should enqueue only one job when the same dispatch key is sent twice', async () => {
        const { mockFlow, mockToken, mockProject } = await createEnabledFlow()
        const dispatchKey = `${apId()}-0`

        const first = await dispatch({ flowId: mockFlow.id, token: mockToken, dispatchKey, body: { item: 1 } })
        const second = await dispatch({ flowId: mockFlow.id, token: mockToken, dispatchKey, body: { item: 1 } })

        expect(first.statusCode).toBe(StatusCodes.OK)
        expect(second.statusCode).toBe(StatusCodes.OK)

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].id).toBe(`${mockProject.id}-${dispatchKey}`)
    })

    it('should enqueue one job per item when dispatch keys differ', async () => {
        const { mockFlow, mockToken, mockProject } = await createEnabledFlow()
        const prefix = apId()

        await dispatch({ flowId: mockFlow.id, token: mockToken, dispatchKey: `${prefix}-0`, body: { item: 0 } })
        await dispatch({ flowId: mockFlow.id, token: mockToken, dispatchKey: `${prefix}-1`, body: { item: 1 } })

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs.map((job) => job.id).sort()).toEqual([`${mockProject.id}-${prefix}-0`, `${mockProject.id}-${prefix}-1`])
    })

    it('should not collide when two projects send the same dispatch key', async () => {
        const dispatchKey = `${apId()}-0`
        const projectA = await createEnabledFlow()
        const projectB = await createEnabledFlow()

        await dispatch({ flowId: projectA.mockFlow.id, token: projectA.mockToken, dispatchKey, body: { item: 1 } })
        await dispatch({ flowId: projectB.mockFlow.id, token: projectB.mockToken, dispatchKey, body: { item: 1 } })

        expect(await findQueuedJobsForFlow(projectA.mockFlow.id)).toHaveLength(1)
        expect(await findQueuedJobsForFlow(projectB.mockFlow.id)).toHaveLength(1)
    })

    it('should enqueue both jobs when no dispatch key is sent', async () => {
        const { mockFlow, mockToken } = await createEnabledFlow()

        await dispatch({ flowId: mockFlow.id, token: mockToken, body: { item: 1 } })
        await dispatch({ flowId: mockFlow.id, token: mockToken, body: { item: 1 } })

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs).toHaveLength(2)
    })

    it('should ignore a malformed dispatch key and fall back to a unique job id', async () => {
        const { mockFlow, mockToken } = await createEnabledFlow()
        const malformedKey = 'bull:queue:injected'

        await dispatch({ flowId: mockFlow.id, token: mockToken, dispatchKey: malformedKey, body: { item: 1 } })
        await dispatch({ flowId: mockFlow.id, token: mockToken, dispatchKey: malformedKey, body: { item: 1 } })

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs).toHaveLength(2)
        expect(jobs.every((job) => job.id !== malformedKey)).toBe(true)
    })
})

describe('Parent waitpoint header', () => {
    it('should carry a valid parent waitpoint id onto the queued job', async () => {
        const { mockFlow, mockToken } = await createEnabledFlow()
        const parentWaitpointId = apId()

        await dispatch({ flowId: mockFlow.id, token: mockToken, parentWaitpointId, body: { item: 1 } })

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].data.parentWaitpointId).toBe(parentWaitpointId)
    })

    it('should drop a malformed parent waitpoint id', async () => {
        const { mockFlow, mockToken } = await createEnabledFlow()

        await dispatch({ flowId: mockFlow.id, token: mockToken, parentWaitpointId: 'not-an-ap-id', body: { item: 1 } })

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].data.parentWaitpointId).toBeUndefined()
    })

    it('should leave the job without a parent waitpoint id when the header is absent', async () => {
        const { mockFlow, mockToken } = await createEnabledFlow()

        await dispatch({ flowId: mockFlow.id, token: mockToken, body: { item: 1 } })

        const jobs = await findQueuedJobsForFlow(mockFlow.id)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].data.parentWaitpointId).toBeUndefined()
    })
})

type DispatchParams = {
    flowId: string
    token: string
    dispatchKey?: string
    parentWaitpointId?: string
    body: unknown
}
