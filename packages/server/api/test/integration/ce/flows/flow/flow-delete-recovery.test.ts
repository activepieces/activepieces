import { apId } from '@activepieces/core-utils'
import { TriggerStrategy } from '@activepieces/pieces-framework'
import { Flow, FlowOperationStatus, FlowStatus, FlowTriggerType, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { Job } from 'bullmq'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowSideEffects } from '../../../../../src/app/flows/flow/flow-service-side-effects'
import { flowBackgroundJobs } from '../../../../../src/app/flows/flow/flow.jobs'
import { InterceptorVerdict } from '../../../../../src/app/workers/job-queue/job-interceptor'
import { zombiePollingInterceptor } from '../../../../../src/app/workers/job-queue/interceptors/zombie-polling-interceptor'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function savePublishedFlow(ctx: TestContext, flow?: Partial<Flow>): Promise<Flow> {
    const mockFlow = createMockFlow({
        projectId: ctx.project.id,
        status: FlowStatus.ENABLED,
        ...flow,
    })
    await db.save('flow', mockFlow)
    const mockVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', mockVersion)
    await db.update('flow', mockFlow.id, { publishedVersionId: mockVersion.id })
    return mockFlow
}

async function waitForRowToDisappear(flowId: string): Promise<Flow | null> {
    for (let attempt = 0; attempt < 40; attempt++) {
        const row = await db.findOneBy<Flow>('flow', { id: flowId })
        if (row === null) {
            return null
        }
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    return db.findOneBy<Flow>('flow', { id: flowId })
}

async function savePollingFlowWithLiveTrigger(ctx: TestContext, flow?: Partial<Flow>): Promise<{ flowId: string, flowVersionId: string }> {
    const mockFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED, ...flow })
    await db.save('flow', mockFlow)
    const mockVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', mockVersion)
    await db.update('flow', mockFlow.id, { publishedVersionId: mockVersion.id })
    await db.save('trigger_source', {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        flowId: mockFlow.id,
        flowVersionId: mockVersion.id,
        projectId: ctx.project.id,
        pieceName: '@activepieces/piece-schedule',
        pieceVersion: '0.1.0',
        triggerName: 'every_hour',
        type: TriggerStrategy.POLLING,
        simulate: false,
        schedule: null,
        deleted: null,
    })
    return { flowId: mockFlow.id, flowVersionId: mockVersion.id }
}

async function dispatchPollingJob(ctx: TestContext, flowId: string, flowVersionId: string): Promise<InterceptorVerdict> {
    const result = await zombiePollingInterceptor.preDispatch({
        jobId: apId(),
        jobData: {
            jobType: WorkerJobType.EXECUTE_POLLING,
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            flowId,
            flowVersionId,
            triggerType: FlowTriggerType.PIECE,
        },
        job: {} as Job,
        log: app!.log,
    })
    return result.verdict
}

describe('Flow deletion recovery', () => {
    it('disables the flow before the delete job runs, so its trigger stops firing', async () => {
        const ctx = await createTestContext(app!)
        const flow = await savePublishedFlow(ctx)

        const response = await ctx.delete(`/v1/flows/${flow.id}`)

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const row = await db.findOneBy<Flow>('flow', { id: flow.id })
        expect(row?.status ?? FlowStatus.DISABLED).toBe(FlowStatus.DISABLED)
    })

    it('accepts a second delete for a flow already stranded in DELETING', async () => {
        const ctx = await createTestContext(app!)
        const flow = await savePublishedFlow(ctx, { operationStatus: FlowOperationStatus.DELETING })

        const response = await ctx.delete(`/v1/flows/${flow.id}`)

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await waitForRowToDisappear(flow.id)).toBeNull()
    })

    it('sweeps a flow whose delete job was lost, without a user asking again', async () => {
        const ctx = await createTestContext(app!)
        const flow = await savePublishedFlow(ctx, { operationStatus: FlowOperationStatus.DELETING })
        await db.update('flow', flow.id, { updated: dayjs().subtract(1, 'hour').toISOString() })

        await flowBackgroundJobs(app!.log).strandedDeletionSweepHandler()

        expect(await waitForRowToDisappear(flow.id)).toBeNull()
    })

    it('discards the polling job of a flow being deleted, so it stops firing runs', async () => {
        const ctx = await createTestContext(app!)
        const { flowId, flowVersionId } = await savePollingFlowWithLiveTrigger(ctx, { operationStatus: FlowOperationStatus.DELETING })

        expect(await dispatchPollingJob(ctx, flowId, flowVersionId)).toBe(InterceptorVerdict.DISCARD)
    })

    it('still dispatches the polling job of a flow that is not being deleted', async () => {
        const ctx = await createTestContext(app!)
        const { flowId, flowVersionId } = await savePollingFlowWithLiveTrigger(ctx)

        expect(await dispatchPollingJob(ctx, flowId, flowVersionId)).toBe(InterceptorVerdict.ALLOW)
    })

    it('tears the trigger source down even though delete() already wrote DISABLED', async () => {
        const ctx = await createTestContext(app!)
        const { flowId } = await savePollingFlowWithLiveTrigger(ctx, { status: FlowStatus.DISABLED })
        const flowToDelete = await db.findOneByOrFail<Flow>('flow', { id: flowId })

        await flowSideEffects(app!.log).preDelete({ flowToDelete })

        const triggerSource = await db.findOneBy<{ deleted: string | null }>('trigger_source', { flowId })
        expect(triggerSource).toBeNull()
    })

    it('moves a swept flow to the back of the queue so a failing one cannot starve the rest', async () => {
        const ctx = await createTestContext(app!)
        const mockFlow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
            operationStatus: FlowOperationStatus.DELETING,
        })
        await db.save('flow', mockFlow)
        const mockVersion = createMockFlowVersion({ flowId: mockFlow.id })
        await db.save('flow_version', mockVersion)
        await db.update('flow', mockFlow.id, { publishedVersionId: mockVersion.id })
        await db.save('trigger_source', {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            flowId: mockFlow.id,
            flowVersionId: apId(),
            projectId: ctx.project.id,
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: '0.1.0',
            triggerName: 'every_hour',
            type: TriggerStrategy.POLLING,
            simulate: false,
            schedule: null,
        })
        await db.update('flow', mockFlow.id, { updated: dayjs().subtract(2, 'hour').toISOString() })

        await flowBackgroundJobs(app!.log).strandedDeletionSweepHandler()
        const afterFirstSweep = await db.findOneByOrFail<Flow>('flow', { id: mockFlow.id })

        await flowBackgroundJobs(app!.log).strandedDeletionSweepHandler()
        const afterSecondSweep = await db.findOneByOrFail<Flow>('flow', { id: mockFlow.id })

        expect(dayjs(afterFirstSweep.updated).isAfter(dayjs().subtract(1, 'minute'))).toBe(true)
        expect(dayjs(afterSecondSweep.updated).isSame(afterFirstSweep.updated)).toBe(true)
    })

    it('is gone to every reader the moment the request returns, not when the job lands', async () => {
        const ctx = await createTestContext(app!)
        const flow = await savePublishedFlow(ctx, { operationStatus: FlowOperationStatus.DELETING })

        const opened = await ctx.get(`/v1/flows/${flow.id}`)
        const listed = await ctx.get('/v1/flows', { projectId: ctx.project.id })

        expect(opened?.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(listed?.json().data.map((f: Flow) => f.id)).not.toContain(flow.id)
    })

    it('frees the external id so the flow can be recreated while the tombstone lingers', async () => {
        const ctx = await createTestContext(app!)
        const flow = await savePublishedFlow(ctx, { operationStatus: FlowOperationStatus.DELETING })

        const response = await ctx.post('/v1/flows', {
            displayName: 'recreated',
            projectId: ctx.project.id,
            externalId: flow.externalId,
        }, { query: { projectId: ctx.project.id } })

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        expect(response?.json().externalId).toBe(flow.externalId)
    })

    it('leaves a recently requested deletion to its own job', async () => {
        const ctx = await createTestContext(app!)
        const flow = await savePublishedFlow(ctx, { operationStatus: FlowOperationStatus.DELETING })

        await flowBackgroundJobs(app!.log).strandedDeletionSweepHandler()

        expect(await db.findOneBy<Flow>('flow', { id: flow.id })).not.toBeNull()
    })
})
