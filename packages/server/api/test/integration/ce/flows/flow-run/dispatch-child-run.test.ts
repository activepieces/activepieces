import { apId } from '@activepieces/core-utils'
import { FlowActionType, FlowRunStatus, FlowTriggerType, FlowVersionState, PrincipalType, RunEnvironment } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { fanInBarrier } from '../../../../../src/app/flows/flow-run/waitpoint/fan-in-barrier'
import { jobQueue } from '../../../../../src/app/workers/job-queue/job-queue'
import { generateMockToken } from '../../../../helpers/auth'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, createMockWaitpoint } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app)
})

const BODY_ENTRY_STEP = 'body_step'

function triggerWithBatchBody() {
    return {
        type: FlowTriggerType.EMPTY,
        name: 'trigger',
        settings: {},
        valid: true,
        displayName: 'Trigger',
        nextAction: {
            type: FlowActionType.PROCESS_IN_BATCHES,
            name: 'batches',
            displayName: 'Process in Batches',
            valid: true,
            skip: false,
            settings: { items: '{{ trigger.output }}', batchSize: 2 },
            firstLoopAction: {
                type: FlowActionType.CODE,
                name: BODY_ENTRY_STEP,
                displayName: 'Body',
                valid: true,
                skip: false,
                settings: { input: {}, sourceCode: { code: '', packageJson: '' } },
            },
        },
    }
}

async function createParent(projectId: string = ctx.project.id) {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
        trigger: triggerWithBatchBody(),
    })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.RUNNING,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)
    return { flow, flowVersion, flowRun }
}

async function engineTokenFor(projectId: string, platformId: string) {
    return generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        projectId,
        platform: { id: platformId },
    })
}

async function dispatch({ token, body }: { token: string, body: Record<string, unknown> }) {
    return app.inject({
        method: 'POST',
        url: '/api/v1/flow-runs/dispatch',
        headers: { authorization: `Bearer ${token}` },
        body,
    })
}

async function findQueuedJobsForRun(runId: string): Promise<Job[]> {
    const queues = jobQueue(app.log).getAllQueues()
    const jobsPerQueue = await Promise.all(queues.map((queue) => queue.getJobs(['waiting', 'prioritized', 'delayed', 'active', 'completed', 'failed'])))
    return jobsPerQueue.flat().filter((job) => {
        const data: unknown = job.data
        return typeof data === 'object' && data !== null && 'runId' in data && data.runId === runId
    })
}

describe('POST /v1/flow-runs/dispatch', () => {
    it('creates the child run row before returning, queued and carrying its dispatch index', async () => {
        const { flowRun, flowVersion } = await createParent()
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                dispatchIndex: 3,
                dispatchKey: `${apId()}-3`,
            },
        })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        const childId = response.json().id
        const child = await db.findOneByOrFail('flow_run', { id: childId })
        expect(child).toMatchObject({
            status: FlowRunStatus.QUEUED,
            projectId: ctx.project.id,
            flowVersionId: flowVersion.id,
            parentRunId: flowRun.id,
            dispatchIndex: 3,
            failParentOnFailure: false,
            environment: RunEnvironment.PRODUCTION,
        })
    })

    it('starts the child from the entry step with the seeded prior-step state', async () => {
        const { flowRun } = await createParent()
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: { upstream: { type: 'CODE', status: 'SUCCEEDED', input: {}, output: { rows: [1] } } },
                dispatchIndex: 0,
                dispatchKey: `${apId()}-0`,
            },
        })

        const jobs = await findQueuedJobsForRun(response.json().id)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].data).toMatchObject({
            executionType: 'BEGIN',
            entryStepName: BODY_ENTRY_STEP,
            payload: { type: 'inline', value: { upstream: { output: { rows: [1] } } } },
        })
    })

    it('attributes the child to a barrier that resolves in the project', async () => {
        const { flowRun } = await createParent()
        const barrier = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'batches',
            isFanIn: true,
            dispatchDigest: 'a'.repeat(64),
        })
        await db.save('waitpoint', barrier)
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                parentWaitpointId: barrier.id,
                dispatchIndex: 1,
                dispatchKey: `${barrier.id}-1`,
            },
        })

        expect(response.json().attributedToBarrier).toBe(true)
        const children = await fanInBarrier.listChildren({ parentWaitpointId: barrier.id, projectId: ctx.project.id })
        expect(children).toEqual([{ id: response.json().id, status: FlowRunStatus.QUEUED, dispatchIndex: 1 }])
    })

    it('returns the child already dispatched for an index instead of attributing a second one to the barrier', async () => {
        const { flowRun } = await createParent()
        const barrier = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'batches',
            isFanIn: true,
            dispatchDigest: 'a'.repeat(64),
        })
        await db.save('waitpoint', barrier)
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)
        const body = {
            parentRunId: flowRun.id,
            entryStepName: BODY_ENTRY_STEP,
            seedSteps: {},
            parentWaitpointId: barrier.id,
            dispatchIndex: 1,
            dispatchKey: `${barrier.id}-1`,
        }

        const first = await dispatch({ token, body })
        const second = await dispatch({ token, body })

        expect(second.statusCode).toBe(StatusCodes.CREATED)
        expect(second.json().id).toBe(first.json().id)
        const children = await fanInBarrier.listChildren({ parentWaitpointId: barrier.id, projectId: ctx.project.id })
        expect(children).toHaveLength(1)
    })

    it('creates the child without attribution when the barrier does not resolve', async () => {
        const { flowRun } = await createParent()
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                parentWaitpointId: apId(),
                dispatchIndex: 0,
                dispatchKey: `${apId()}-0`,
            },
        })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().attributedToBarrier).toBe(false)
        const child = await db.findOneByOrFail('flow_run', { id: response.json().id })
        expect(child.parentWaitpointId).toBeNull()
    })

    it('does not attribute a barrier that belongs to another project', async () => {
        const { flowRun } = await createParent()
        const otherCtx = await createTestContext(app)
        const otherParent = await createParent(otherCtx.project.id)
        const foreignBarrier = createMockWaitpoint({
            flowRunId: otherParent.flowRun.id,
            projectId: otherCtx.project.id,
            stepName: 'batches',
            isFanIn: true,
            dispatchDigest: 'b'.repeat(64),
        })
        await db.save('waitpoint', foreignBarrier)
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                parentWaitpointId: foreignBarrier.id,
                dispatchIndex: 0,
                dispatchKey: `${apId()}-0`,
            },
        })

        expect(response.json().attributedToBarrier).toBe(false)
        const children = await fanInBarrier.listChildren({ parentWaitpointId: foreignBarrier.id, projectId: otherCtx.project.id })
        expect(children).toHaveLength(0)
    })

    it('namespaces the queue job id by project and uses no colon', async () => {
        const { flowRun } = await createParent()
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)
        const dispatchKey = `${apId()}-0`

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                dispatchIndex: 0,
                dispatchKey,
            },
        })

        const jobs = await findQueuedJobsForRun(response.json().id)
        expect(jobs[0].id).toBe(`${ctx.project.id}-${dispatchKey}`)
        expect(jobs[0].id).not.toContain(':')
    })

    it('rejects a parent run from another project as a client error', async () => {
        const otherCtx = await createTestContext(app)
        const foreignParent = await createParent(otherCtx.project.id)
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: foreignParent.flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                dispatchIndex: 0,
                dispatchKey: `${apId()}-0`,
            },
        })

        expect(response.statusCode).toBeGreaterThanOrEqual(StatusCodes.BAD_REQUEST)
        expect(response.statusCode).toBeLessThan(StatusCodes.INTERNAL_SERVER_ERROR)
    })

    it('rejects an entry step that is not in the flow version as a client error', async () => {
        const { flowRun } = await createParent()
        const token = await engineTokenFor(ctx.project.id, ctx.platform.id)

        const response = await dispatch({
            token,
            body: {
                parentRunId: flowRun.id,
                entryStepName: 'not_a_step',
                seedSteps: {},
                dispatchIndex: 0,
                dispatchKey: `${apId()}-0`,
            },
        })

        expect(response.statusCode).toBeGreaterThanOrEqual(StatusCodes.BAD_REQUEST)
        expect(response.statusCode).toBeLessThan(StatusCodes.INTERNAL_SERVER_ERROR)
    })

    it('refuses an unauthenticated dispatch', async () => {
        const { flowRun } = await createParent()

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/flow-runs/dispatch',
            body: {
                parentRunId: flowRun.id,
                entryStepName: BODY_ENTRY_STEP,
                seedSteps: {},
                dispatchIndex: 0,
                dispatchKey: `${apId()}-0`,
            },
        })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})
