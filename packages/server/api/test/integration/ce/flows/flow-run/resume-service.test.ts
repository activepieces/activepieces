import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { resumeService } from '../../../../../src/app/flows/flow-run/waitpoint/resume-service'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { WaitpointStatus } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-types'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
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

async function createFlowRunAndWaitpoint(params: {
    projectId: string
    flowRunStatus?: FlowRunStatus
    waitpointStatus?: WaitpointStatus
}) {
    const flow = createMockFlow({ projectId: params.projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
    })
    await db.save('flow_version', flowVersion)

    const flowRun = createMockFlowRun({
        projectId: params.projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: params.flowRunStatus ?? FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    const waitpointId = apId()
    await db.save('waitpoint', {
        id: waitpointId,
        flowRunId: flowRun.id,
        projectId: params.projectId,
        stepName: 'approval',
        type: 'WEBHOOK',
        status: params.waitpointStatus ?? WaitpointStatus.PENDING,
        httpRequestId: null,
        workerHandlerId: null,
    })

    return { flow, flowVersion, flowRun, waitpointId }
}

describe('resumeService resumeFromWaitpointWithoutLock', () => {
    it('consumes a PENDING waitpoint and enqueues resume when flow is PAUSED (worker-before-callback ordering)', async () => {
        const { flowRun, waitpointId } = await createFlowRunAndWaitpoint({
            projectId: ctx.project.id,
            flowRunStatus: FlowRunStatus.PAUSED,
            waitpointStatus: WaitpointStatus.PENDING,
        })

        const result = await resumeService(app.log).resumeFromWaitpointWithoutLock({
            flowRunId: flowRun.id,
            waitpointId,
            resumePayload: { body: { status: 'approved' } },
        })

        expect(result.stale).toBe(false)

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).toBeNull()
    })

    it('consumes a COMPLETED waitpoint when race recovery fires (callback-before-worker ordering)', async () => {
        const { flowRun, waitpointId } = await createFlowRunAndWaitpoint({
            projectId: ctx.project.id,
            flowRunStatus: FlowRunStatus.RUNNING,
            waitpointStatus: WaitpointStatus.PENDING,
        })

        await waitpointService(app.log).complete({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            waitpointId,
            resumePayload: { body: { status: 'early' } },
        })

        await db.update('flow_run', flowRun.id, { status: FlowRunStatus.PAUSED })

        const result = await resumeService(app.log).resumeFromWaitpointWithoutLock({
            flowRunId: flowRun.id,
            waitpointId,
            resumePayload: { body: { status: 'early' } },
        })

        expect(result.stale).toBe(false)

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).toBeNull()
    })

    it('does not leave a stale COMPLETED row to poison the next pause cycle (leftover-row regression)', async () => {
        const { flowRun, waitpointId } = await createFlowRunAndWaitpoint({
            projectId: ctx.project.id,
            flowRunStatus: FlowRunStatus.RUNNING,
            waitpointStatus: WaitpointStatus.PENDING,
        })

        await waitpointService(app.log).complete({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            waitpointId,
            resumePayload: { body: { status: 'quick' } },
        })

        await db.update('flow_run', flowRun.id, { status: FlowRunStatus.PAUSED })

        await resumeService(app.log).resumeFromWaitpointWithoutLock({
            flowRunId: flowRun.id,
            waitpointId,
            resumePayload: { body: { status: 'quick' } },
        })

        const freshPause = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            type: PauseType.WEBHOOK,
            version: 'V1',
        })

        expect(freshPause.inserted).toBe(true)
        expect(freshPause.waitpoint.status).toBe(WaitpointStatus.PENDING)
        expect(freshPause.waitpoint.stepName).toBe('approval')
        expect(freshPause.waitpoint.resumePayload).toBeNull()
    })

    it('returns stale=true when no PENDING waitpoint exists', async () => {
        const { flowRun } = await createFlowRunAndWaitpoint({
            projectId: ctx.project.id,
            flowRunStatus: FlowRunStatus.PAUSED,
            waitpointStatus: WaitpointStatus.PENDING,
        })

        const bogusWaitpointId = apId()
        const result = await resumeService(app.log).resumeFromWaitpointWithoutLock({
            flowRunId: flowRun.id,
            waitpointId: bogusWaitpointId,
            resumePayload: { body: { status: 'stale' } },
        })

        expect(result.stale).toBe(true)

        const waitpoint = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
        expect(waitpoint).not.toBeNull()
    })
})
