import { ErrorCode } from '@activepieces/core-utils'
import { FlowVersionState, PieceTrigger, RunEnvironment, StreamStepProgress } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { flowRunService } from '../../../../../src/app/flows/flow-run/flow-run-service'
import { jobQueue } from '../../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockPieceTrigger } from '../../../../helpers/mocks'
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

describe('flowRunService.startManualTrigger', () => {
    it('refuses a flow version whose trigger is not manual', async () => {
        const flowVersionId = await saveLockedVersion({
            trigger: createMockPieceTrigger({ pieceName: '@activepieces/piece-webhook', triggerName: 'catch_webhook' }),
        })

        await expect(flowRunService(app.log).startManualTrigger({
            projectId: ctx.project.id,
            flowVersionId,
            triggeredBy: ctx.user.id,
        })).rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })
    })

    it('starts a PRODUCTION run that streams to the builder for a manual trigger', async () => {
        const flowVersionId = await saveLockedVersion({
            trigger: createMockPieceTrigger({ pieceName: '@activepieces/piece-manual-trigger', triggerName: 'manual_trigger' }),
        })

        const flowRun = await flowRunService(app.log).startManualTrigger({
            projectId: ctx.project.id,
            flowVersionId,
            triggeredBy: ctx.user.id,
        })

        expect(flowRun.environment).toBe(RunEnvironment.PRODUCTION)
        const jobs = await Promise.all(jobQueue(app.log).getAllQueues().map((queue) => queue.getJobs(['waiting', 'prioritized', 'delayed', 'active'])))
        const job = jobs.flat().find((queuedJob) => {
            const data: unknown = queuedJob.data
            return typeof data === 'object' && data !== null && 'runId' in data && data.runId === flowRun.id
        })
        expect(job?.data).toMatchObject({ streamStepProgress: StreamStepProgress.WEBSOCKET })
    })
})

async function saveLockedVersion({ trigger }: { trigger: PieceTrigger }): Promise<string> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, trigger })
    await db.save('flow_version', flowVersion)
    return flowVersion.id
}
