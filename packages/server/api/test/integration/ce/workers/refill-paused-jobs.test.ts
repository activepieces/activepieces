import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { resumeDelayJobId, waitpointService } from '../../../../src/app/waitpoints/waitpoint-service'
import { WaitpointStatus } from '../../../../src/app/waitpoints/waitpoint-types'
import { refillPausedRuns } from '../../../../src/app/workers/migrations/refill-paused-jobs'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const REFILL_MIGRATION_KEY = 'refill_paused_runs_v7'

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

async function createPausedRun(): Promise<{ id: string }> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)
    return flowRun
}

async function insertConsumedBarrier({ flowRunId }: { flowRunId: string }): Promise<void> {
    const now = dayjs().toISOString()
    await databaseConnection().getRepository('waitpoint').insert({
        id: apId(),
        created: now,
        updated: now,
        flowRunId,
        projectId: ctx.project.id,
        stepName: 'fan_in',
        type: PauseType.BARRIER,
        version: 'V1',
        status: WaitpointStatus.CONSUMED,
        resumeDateTime: dayjs().add(30, 'day').toISOString(),
        responseToSend: null,
        workerHandlerId: null,
        httpRequestId: null,
        resumePayload: null,
        sealed: true,
        policy: null,
    })
}

async function createPendingDelay({ flowRunId, stepName }: { flowRunId: string, stepName: string }): Promise<{ id: string }> {
    const { waitpoint } = await waitpointService(app.log).createForPause({
        flowRunId,
        projectId: ctx.project.id,
        stepName,
        type: PauseType.DELAY,
        version: 'V1',
        resumeDateTime: dayjs().add(1, 'hour').toISOString(),
    })
    return waitpoint
}

async function loseScheduledTimers({ waitpointIds }: { waitpointIds: string[] }): Promise<void> {
    for (const waitpointId of waitpointIds) {
        const job = await systemJobsSchedule(app.log).getJob(resumeDelayJobId(waitpointId))
        await job?.remove()
    }
    const redis = await redisConnections.useExisting()
    await redis.del(REFILL_MIGRATION_KEY)
}

async function timerIsArmed({ waitpointId }: { waitpointId: string }): Promise<boolean> {
    const job = await systemJobsSchedule(app.log).getJob(resumeDelayJobId(waitpointId))
    return !isNilJob(job)
}

function isNilJob(job: unknown): boolean {
    return job === undefined || job === null
}

describe('refillPausedRuns', () => {
    it('re-arms the timer of a run whose only waitpoint is a pending DELAY', async () => {
        const flowRun = await createPausedRun()
        const delay = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'delay_step' })

        await loseScheduledTimers({ waitpointIds: [delay.id] })
        expect(await timerIsArmed({ waitpointId: delay.id })).toBe(false)

        await refillPausedRuns(app.log).run()

        expect(await timerIsArmed({ waitpointId: delay.id })).toBe(true)
    })

    it('re-arms the timer when a consumed barrier tombstone shares the run', async () => {
        const flowRun = await createPausedRun()
        await insertConsumedBarrier({ flowRunId: flowRun.id })
        const delay = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'delay_step' })

        await loseScheduledTimers({ waitpointIds: [delay.id] })
        await refillPausedRuns(app.log).run()

        expect(await timerIsArmed({ waitpointId: delay.id })).toBe(true)
    })

    it('re-arms the timer when the tombstone was written after the delay', async () => {
        const flowRun = await createPausedRun()
        const delay = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'delay_step' })
        await insertConsumedBarrier({ flowRunId: flowRun.id })

        await loseScheduledTimers({ waitpointIds: [delay.id] })
        expect(await timerIsArmed({ waitpointId: delay.id })).toBe(false)

        await refillPausedRuns(app.log).run()

        expect(await timerIsArmed({ waitpointId: delay.id })).toBe(true)
    })

    it('re-arms every timer when one run holds several pending delays', async () => {
        const flowRun = await createPausedRun()
        const first = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'loop_1:0/delay_step' })
        const second = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'loop_1:1/delay_step' })

        await loseScheduledTimers({ waitpointIds: [first.id, second.id] })
        await refillPausedRuns(app.log).run()

        expect(await timerIsArmed({ waitpointId: first.id })).toBe(true)
        expect(await timerIsArmed({ waitpointId: second.id })).toBe(true)
    })

    it('leaves a delivered waitpoint alone', async () => {
        const flowRun = await createPausedRun()
        const delay = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'delay_step' })
        await databaseConnection().getRepository('waitpoint').update({ id: delay.id }, { status: WaitpointStatus.COMPLETED })

        await loseScheduledTimers({ waitpointIds: [delay.id] })
        await refillPausedRuns(app.log).run()

        expect(await timerIsArmed({ waitpointId: delay.id })).toBe(false)
    })

    it('runs once and then leaves the migration key set', async () => {
        const flowRun = await createPausedRun()
        const delay = await createPendingDelay({ flowRunId: flowRun.id, stepName: 'delay_step' })

        await loseScheduledTimers({ waitpointIds: [delay.id] })
        await refillPausedRuns(app.log).run()

        const redis = await redisConnections.useExisting()
        expect(await redis.get(REFILL_MIGRATION_KEY)).toBe('true')
    })
})
