import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { maybeResumeFanInBarrier, runsMetadataQueue } from '../../../../../src/app/flows/flow-run/flow-runs-queue'
import { fanInBarrier, FanInSummary } from '../../../../../src/app/flows/flow-run/waitpoint/fan-in-barrier'
import { handleResumeDelayWaitpoint } from '../../../../../src/app/flows/flow-run/waitpoint/resume-delay-handler'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { Waitpoint, WaitpointStatus } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-types'
import { resumeDelayJobId, SystemJobName } from '../../../../../src/app/helper/system-jobs/common'
import { systemJobHandlers } from '../../../../../src/app/helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../../../../src/app/helper/system-jobs/system-job'
import { redisMetadataKey } from '../../../../../src/app/workers/job'
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

async function createParentRun(status: FlowRunStatus = FlowRunStatus.PAUSED) {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)
    return { flow, flowVersion, flowRun }
}

async function createChildren({ parentRunId, parentWaitpointId, statuses }: {
    parentRunId?: string
    parentWaitpointId?: string
    statuses: FlowRunStatus[]
}) {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const children = statuses.map((status) => createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status,
        parentRunId,
        parentWaitpointId,
        environment: RunEnvironment.PRODUCTION,
    }))
    for (const child of children) {
        await db.save('flow_run', child)
    }
    return children
}

async function seedBarrier({ flowRunId, expectedChildren, status, resumePayload, stepName }: {
    flowRunId: string
    expectedChildren?: number | null
    status?: WaitpointStatus
    resumePayload?: Waitpoint['resumePayload']
    stepName?: string
}) {
    const waitpoint = createMockWaitpoint({
        flowRunId,
        projectId: ctx.project.id,
        stepName: stepName ?? 'fan_out',
        isFanIn: true,
        expectedChildren: expectedChildren ?? null,
        status: status ?? WaitpointStatus.PENDING,
        resumePayload: resumePayload ?? null,
    })
    await db.save('waitpoint', waitpoint)
    return waitpoint
}

function createBarrier({ flowRunId }: { flowRunId: string }) {
    return waitpointService(app.log).createForPause({
        flowRunId,
        projectId: ctx.project.id,
        stepName: 'fan_out',
        type: PauseType.WEBHOOK,
        version: 'V1',
        isFanIn: true,
    })
}

describe('fanInBarrier predicate', () => {
    it('classifies every terminal status into the right bucket', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({
            parentWaitpointId: barrier.id,
            statuses: [
                FlowRunStatus.SUCCEEDED,
                FlowRunStatus.FAILED,
                FlowRunStatus.TIMEOUT,
                FlowRunStatus.QUOTA_EXCEEDED,
                FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
                FlowRunStatus.LOG_SIZE_EXCEEDED,
                FlowRunStatus.INTERNAL_ERROR,
                FlowRunStatus.CANCELED,
                FlowRunStatus.QUEUED,
                FlowRunStatus.RUNNING,
                FlowRunStatus.PAUSED,
            ],
        })

        const counts = await fanInBarrier.countChildren({ parentWaitpointId: barrier.id, projectId: ctx.project.id })

        expect(counts.succeeded).toBe(1)
        expect(counts.failed).toBe(6)
        expect(counts.canceled).toBe(1)
        expect(counts.stillRunning).toBe(3)
        expect(counts.terminal).toBe(8)
    })

    it('ignores children of another barrier and unattributed children of the same run', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        const otherBarrier = await seedBarrier({ flowRunId: flowRun.id, stepName: 'fan_out_other' })
        await createChildren({ parentRunId: flowRun.id, parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })
        await createChildren({ parentRunId: flowRun.id, parentWaitpointId: otherBarrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED] })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })

        const counts = await fanInBarrier.countChildren({ parentWaitpointId: barrier.id, projectId: ctx.project.id })

        expect(counts.terminal).toBe(1)
        expect(counts.succeeded).toBe(1)
    })

    it('ignores children belonging to another project', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })

        const counts = await fanInBarrier.countChildren({ parentWaitpointId: barrier.id, projectId: apId() })

        expect(counts.terminal).toBe(0)
    })

    it('counts archived children', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        const [child] = await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })
        await db.update('flow_run', child.id, { archivedAt: dayjs().toISOString() })

        const counts = await fanInBarrier.countChildren({ parentWaitpointId: barrier.id, projectId: ctx.project.id })

        expect(counts.succeeded).toBe(1)
    })

    it('is not releasable while unsealed, even when every child is terminal', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: null })
        const counts = { succeeded: 3, failed: 0, canceled: 0, stillRunning: 0, terminal: 3 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(false)
    })

    it('is not releasable while any child is non-terminal', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 3 })
        const counts = { succeeded: 3, failed: 0, canceled: 0, stillRunning: 1, terminal: 3 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(false)
    })

    it('is not releasable while the terminal count is short of the expected count', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 3 })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(false)
    })

    it('is releasable for an empty fan-out', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 0 })
        const counts = { succeeded: 0, failed: 0, canceled: 0, stillRunning: 0, terminal: 0 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(true)
    })

    it('reports every bucket exactly, without baseline arithmetic', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 4 })
        const counts = { succeeded: 2, failed: 1, canceled: 1, stillRunning: 0, terminal: 4 }

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false })

        expect(summary).toEqual({
            expected: 4,
            succeeded: 2,
            failed: 1,
            canceled: 1,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 0,
            timedOut: false,
        })
    })

    it('reports items that never reached the subflow and folds them into the expected total', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 2, failedToDispatch: 1 })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false })

        expect(summary).toEqual({
            expected: 3,
            succeeded: 2,
            failed: 0,
            canceled: 0,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 1,
            timedOut: false,
        })
    })

    it('reports an accepted dispatch that never produced a run as notStarted', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 3 })
        const counts = { succeeded: 1, failed: 0, canceled: 0, stillRunning: 1, terminal: 1 }

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: true })

        expect(summary.notStarted).toBe(1)
        expect(summary.expected).toBe(3)
        expect(summary.timedOut).toBe(true)
    })

    it('releases on the dispatched count, not on the requested count', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 2, failedToDispatch: 1 })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(true)
    })
})

describe('createFanInBarrier', () => {
    it('creates an unsealed barrier', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)

        const { inserted, waitpoint } = await createBarrier({ flowRunId: flowRun.id })

        expect(inserted).toBe(true)
        expect(waitpoint.isFanIn).toBe(true)
        expect(waitpoint.expectedChildren).toBeNull()
    })

    it('reuses the existing barrier on an idempotent re-entry before anything was dispatched', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const first = await createBarrier({ flowRunId: flowRun.id })

        const second = await createBarrier({ flowRunId: flowRun.id })

        expect(second.inserted).toBe(false)
        expect(second.waitpoint.id).toBe(first.waitpoint.id)
    })

    it('refuses to re-enter a barrier whose previous attempt already dispatched children', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const first = await createBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: first.waitpoint.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })

        await expect(createBarrier({ flowRunId: flowRun.id })).rejects.toThrow()
    })

    it('refuses to re-enter a barrier whose previously dispatched children already finished', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const first = await createBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: first.waitpoint.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await expect(createBarrier({ flowRunId: flowRun.id })).rejects.toThrow()
    })

    it('allows a fan-in while an unrelated fire-and-forget child of the same run is still running', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING] })

        const { inserted, waitpoint } = await createBarrier({ flowRunId: flowRun.id })

        expect(inserted).toBe(true)
        expect(waitpoint.expectedChildren).toBeNull()
    })

    it('discards an unsealed barrier leaked by an earlier step of the same run', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const leaked = await seedBarrier({ flowRunId: flowRun.id, stepName: 'fan_out_earlier' })

        await createBarrier({ flowRunId: flowRun.id })

        expect(await db.findOneBy('waitpoint', { id: leaked.id })).toBeNull()
    })

    it('replaces a completed barrier left over from a previous execution of the same step', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const leftover = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: { stale: true } },
        })

        const { inserted, waitpoint } = await createBarrier({ flowRunId: flowRun.id })

        expect(inserted).toBe(true)
        expect(waitpoint.id).not.toBe(leftover.id)
        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
        expect(waitpoint.resumePayload).toBeNull()
    })
})

describe('sealFanInBarrier', () => {
    async function seal({ flowRunId, expectedChildren, failedToDispatch, resumeDateTime }: { flowRunId: string, expectedChildren: number, failedToDispatch?: number, resumeDateTime?: string }) {
        return waitpointService(app.log).createForPause({
            flowRunId,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
            expectedChildren,
            failedToDispatch,
            resumeDateTime,
        })
    }

    it('records the expected count and schedules a timeout job keyed on the waitpoint', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })
        const timeoutAt = dayjs().add(30, 'minute').toISOString()

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, resumeDateTime: timeoutAt })

        expect(waitpoint.id).toBe(barrier.id)
        expect(waitpoint.expectedChildren).toBe(2)
        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
        const job = await systemJobsSchedule(app.log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(resumeDelayJobId({ waitpointId: barrier.id }))
        expect(job).toBeDefined()
        expect(job?.data.waitpointId).toBe(barrier.id)
    })

    it('falls back to a short timeout when the seal carries none, so a forgotten timeout fails fast', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 1 })

        expect(waitpoint.resumeDateTime).not.toBeNull()
        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().add(55, 'minute'))).toBe(true)
        expect(dayjs(waitpoint.resumeDateTime).isBefore(dayjs().add(65, 'minute'))).toBe(true)
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: barrier.id }))).toBeDefined()
    })

    it('still clamps an explicitly requested timeout to the maximum pause duration', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            resumeDateTime: dayjs().add(400, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().add(29, 'day'))).toBe(true)
        expect(dayjs(waitpoint.resumeDateTime).isBefore(dayjs().add(31, 'day'))).toBe(true)
    })

    it('completes immediately without scheduling a timeout when every child is already terminal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED] })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary).toEqual({ expected: 2, succeeded: 1, failed: 1, canceled: 0, stillRunning: 0, notStarted: 0, failedToDispatch: 0, timedOut: false })
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: barrier.id }))).toBeUndefined()
    })

    it('persists the undispatched item count and reports it in the summary', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, failedToDispatch: 1 })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary).toEqual({ expected: 3, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, notStarted: 0, failedToDispatch: 1, timedOut: false })
    })

    it('does not release the second barrier of a run off the first barrier children (loop regression)', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const firstBarrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3, stepName: 'fan_out_earlier' })
        await createChildren({
            parentRunId: flowRun.id,
            parentWaitpointId: firstBarrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED],
        })

        await createBarrier({ flowRunId: flowRun.id })
        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 3, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
    })

    it('clamps a timeout beyond the maximum pause duration', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            resumeDateTime: dayjs().add(365, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isBefore(dayjs().add(31, 'day'))).toBe(true)
        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().add(1, 'day'))).toBe(true)
    })

    it('floors a timeout that is already in the past', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            resumeDateTime: dayjs().subtract(10, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().subtract(1, 'minute'))).toBe(true)
    })

    it('rejects an invalid timeout', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await seedBarrier({ flowRunId: flowRun.id })

        await expect(seal({ flowRunId: flowRun.id, expectedChildren: 1, resumeDateTime: 'not-a-date' })).rejects.toThrow()
    })

    it('leaves an already completed barrier untouched on a duplicate seal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: { expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false } },
        })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, resumeDateTime: dayjs().add(5, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        expect(waitpoint.resumePayload?.body).toEqual({ expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false })
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: barrier.id }))).toBeUndefined()
    })

    it('cannot lower the expected count on a second seal, so nine unmaterialised children cannot be released away', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })
        await seal({ flowRunId: flowRun.id, expectedChildren: 10, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 1, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        expect(waitpoint.expectedChildren).toBe(10)
        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
    })

    it('re-evaluates the release predicate on a duplicate seal instead of failing the run', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        const [child] = await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })
        await seal({ flowRunId: flowRun.id, expectedChildren: 1, resumeDateTime: dayjs().add(30, 'minute').toISOString() })
        await db.update('flow_run', child.id, { status: FlowRunStatus.SUCCEEDED })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 1, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        expect(waitpoint.expectedChildren).toBe(1)
    })

    it('throws when the barrier row no longer exists', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)

        await expect(seal({ flowRunId: flowRun.id, expectedChildren: 1 })).rejects.toThrow()
    })
})

describe('maybeResumeFanInBarrier', () => {
    function resume({ parentWaitpointId }: { parentWaitpointId: string }) {
        return maybeResumeFanInBarrier({ parentWaitpointId, projectId: ctx.project.id, log: app.log })
    }

    it('completes the barrier once the last child reaches a terminal state', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3 })
        await createChildren({
            parentWaitpointId: barrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED, FlowRunStatus.CANCELED],
        })

        await resume({ parentWaitpointId: barrier.id })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('does nothing while children are still running', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3 })
        await createChildren({
            parentWaitpointId: barrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING],
        })

        await resume({ parentWaitpointId: barrier.id })

        const stored = await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })
        expect(stored.status).toBe(WaitpointStatus.PENDING)
    })

    it('blocks release while a child is being retried in place, then releases once it finishes', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3 })
        const children = await createChildren({
            parentWaitpointId: barrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
        })
        await db.update('flow_run', children[2].id, { status: FlowRunStatus.QUEUED })

        await resume({ parentWaitpointId: barrier.id })
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)

        await db.update('flow_run', children[2].id, { status: FlowRunStatus.SUCCEEDED })
        await resume({ parentWaitpointId: barrier.id })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('is unaffected by a retry on the latest version, which is not attributed to the barrier', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3 })
        await createChildren({
            parentRunId: flowRun.id,
            parentWaitpointId: barrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING] })

        await resume({ parentWaitpointId: barrier.id })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('recovers a barrier that was completed without a resume reaching the queue', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: { expected: 1, succeeded: 1, failed: 0, canceled: 0, stillRunning: 0, timedOut: false } },
        })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await resume({ parentWaitpointId: barrier.id })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('leaves a completed barrier alone while the parent has not persisted PAUSED yet', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            status: WaitpointStatus.COMPLETED,
        })

        await resume({ parentWaitpointId: barrier.id })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).not.toBeNull()
    })

    it('does nothing when the parent run is already terminal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.SUCCEEDED)
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await resume({ parentWaitpointId: barrier.id })

        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('does nothing while the barrier is unsealed, even with every child terminal', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })

        await resume({ parentWaitpointId: barrier.id })

        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('does nothing when the waitpoint is not a fan-in barrier', async () => {
        const { flowRun } = await createParentRun()
        const waitpoint = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            isFanIn: false,
        })
        await db.save('waitpoint', waitpoint)

        await resume({ parentWaitpointId: waitpoint.id })

        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: waitpoint.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('does nothing when the barrier belongs to another project', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await maybeResumeFanInBarrier({ parentWaitpointId: barrier.id, projectId: apId(), log: app.log })

        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('releases exactly once under concurrent evaluation', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })

        await Promise.all([
            resume({ parentWaitpointId: barrier.id }),
            resume({ parentWaitpointId: barrier.id }),
        ])

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })
})

describe('handleResumeDelayWaitpoint', () => {
    it('times out a barrier and reports the stragglers without touching them', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        const children = await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING] })

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
        const straggler = await db.findOneByOrFail<{ status: FlowRunStatus }>('flow_run', { id: children[1].id })
        expect(straggler.status).toBe(FlowRunStatus.RUNNING)
    })

    it('resumes an already completed barrier with its stored verdict', async () => {
        const { flowRun } = await createParentRun()
        const storedSummary = { expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false }
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: storedSummary },
        })

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('drops a stale job whose waitpoint is gone', async () => {
        const { flowRun } = await createParentRun()

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: apId() },
            log: app.log,
        })
    })

    it('leaves a non-fan-in delay waitpoint on the unchanged path', async () => {
        const { flowRun } = await createParentRun()
        const waitpoint = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'delay',
            type: PauseType.DELAY,
            isFanIn: false,
        })
        await db.save('waitpoint', waitpoint)

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: waitpoint.id },
            log: app.log,
        })

        expect(await db.findOneBy('waitpoint', { id: waitpoint.id })).toBeNull()
    })

    it('skips a run that is no longer paused', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.SUCCEEDED)
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).not.toBeNull()
    })
})

describe('external resume of a fan-in barrier', () => {
    it('refuses to release the barrier and leaves it pending', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/waitpoints/${barrier.id}`, { approved: true })

        expect(response.statusCode).toBe(200)
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('refuses the sync resume path with GONE', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/waitpoints/${barrier.id}/sync`, {})

        expect(response.statusCode).toBe(410)
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('refuses the deprecated V0 route, which resolves no waitpoint of its own', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/requests/${apId()}`, { approved: true })

        expect(response.statusCode).toBe(200)
        expect(response.json().message).toContain('expired')
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
        expect((await db.findOneByOrFail<{ status: FlowRunStatus }>('flow_run', { id: flowRun.id })).status).toBe(FlowRunStatus.PAUSED)
    })

    it('refuses the deprecated V0 sync route with GONE', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/requests/${apId()}/sync`, {})

        expect(response.statusCode).toBe(410)
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('still resumes a legacy pause that carries no barrier', async () => {
        const { flowRun } = await createParentRun()

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/requests/${apId()}`, { approved: true })

        expect(response.statusCode).toBe(200)
        expect(response.json().message).toContain('recorded')
    })

    it('still resumes a non-fan-in waitpoint', async () => {
        const { flowRun } = await createParentRun()
        const waitpoint = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            isFanIn: false,
        })
        await db.save('waitpoint', waitpoint)

        const response = await ctx.post(`/v1/flow-runs/${flowRun.id}/waitpoints/${waitpoint.id}`, { approved: true })

        expect(response.statusCode).toBe(200)
        expect(await db.findOneBy('waitpoint', { id: waitpoint.id })).toBeNull()
    })
})

describe('a fan-in child that also carries fail-parent-on-failure', () => {
    it('releases its barrier instead of trying to fail the parent through a waitpoint', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
        await db.save('flow_version', flowVersion)
        const child = createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status: FlowRunStatus.RUNNING,
            parentRunId: flowRun.id,
            parentWaitpointId: barrier.id,
            failParentOnFailure: true,
            environment: RunEnvironment.PRODUCTION,
        })
        await db.save('flow_run', child)

        await runsMetadataQueue(app.log).add({ id: child.id, projectId: ctx.project.id, status: FlowRunStatus.FAILED })

        await vi.waitFor(async () => {
            expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
        }, { timeout: 15_000 })
    })
})

describe('parentWaitpointId persistence', () => {
    it('survives the runs-metadata upsert allowlist', async () => {
        const { flowRun } = await createParentRun()
        const parentWaitpointId = apId()

        await runsMetadataQueue(app.log).add({
            id: flowRun.id,
            projectId: ctx.project.id,
            parentWaitpointId,
        })

        const stored = await distributedStore.hgetJson<{ parentWaitpointId?: string }>(redisMetadataKey(flowRun.id))
        expect(stored?.parentWaitpointId).toBe(parentWaitpointId)
    })
})

describe('timeout job lifecycle', () => {
    it('frees the job id so a later barrier in the same run gets its own timeout', async () => {
        const { flowRun } = await createParentRun()
        const first = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: first.id, statuses: [FlowRunStatus.RUNNING] })
        await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
            expectedChildren: 1,
            resumeDateTime: dayjs().add(60, 'minute').toISOString(),
        })
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: first.id }))).toBeDefined()

        await waitpointService(app.log).delete({ id: first.id })

        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: first.id }))).toBeUndefined()

        const second = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: second.id, statuses: [FlowRunStatus.RUNNING] })
        await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
            expectedChildren: 1,
            resumeDateTime: dayjs().add(60, 'minute').toISOString(),
        })

        const job = await systemJobsSchedule(app.log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(resumeDelayJobId({ waitpointId: second.id }))
        expect(job?.data.waitpointId).toBe(second.id)
    })

    it('drains a legacy per-run job only when it names the waitpoint being deleted', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        await systemJobsSchedule(app.log).upsertJob({
            job: {
                name: SystemJobName.RESUME_DELAY_WAITPOINT,
                data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
                jobId: `resume-delay-${flowRun.id}`,
            },
            schedule: { type: 'one-time', date: dayjs().add(60, 'minute') },
        })

        await waitpointService(app.log).delete({ id: barrier.id })

        expect(await systemJobsSchedule(app.log).getJob(`resume-delay-${flowRun.id}`)).toBeUndefined()
    })

    it('keeps a legacy per-run job that names a different waitpoint', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        await systemJobsSchedule(app.log).upsertJob({
            job: {
                name: SystemJobName.RESUME_DELAY_WAITPOINT,
                data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: apId() },
                jobId: `resume-delay-${flowRun.id}`,
            },
            schedule: { type: 'one-time', date: dayjs().add(60, 'minute') },
        })

        await waitpointService(app.log).delete({ id: barrier.id })

        expect(await systemJobsSchedule(app.log).getJob(`resume-delay-${flowRun.id}`)).toBeDefined()
    })
})

describe('sweepOverdueDeadlines', () => {
    async function seedDeadline({ flowRunId, minutesFromNow, type, isFanIn, expectedChildren, stepName }: {
        flowRunId: string
        minutesFromNow: number
        type?: PauseType
        isFanIn?: boolean
        expectedChildren?: number | null
        stepName?: string
    }) {
        const waitpoint = createMockWaitpoint({
            flowRunId,
            projectId: ctx.project.id,
            stepName: stepName ?? 'fan_out',
            type: type ?? PauseType.WEBHOOK,
            isFanIn: isFanIn ?? true,
            expectedChildren: expectedChildren ?? null,
            status: WaitpointStatus.PENDING,
            resumeDateTime: dayjs().add(minutesFromNow, 'minute').toISOString(),
        })
        await db.save('waitpoint', waitpoint)
        return waitpoint
    }

    it('recovers a sealed barrier whose timeout job was lost from redis, all the way to the resume', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -5, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING] })
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: barrier.id }))).toBeUndefined()

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).toContain(barrier.id)

        await vi.waitFor(async () => {
            expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
        }, { timeout: 15_000 })
    })

    it('re-arms a plain DELAY waitpoint, not only a fan-in barrier', async () => {
        const { flowRun } = await createParentRun()
        const waitpoint = await seedDeadline({
            flowRunId: flowRun.id,
            minutesFromNow: -1,
            type: PauseType.DELAY,
            isFanIn: false,
            stepName: 'delay',
        })

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).toContain(waitpoint.id)
    })

    it('skips a waitpoint whose run is no longer paused', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -5, expectedChildren: 1 })

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).not.toContain(barrier.id)
    })

    it('skips a deadline that has not passed yet', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: 30, expectedChildren: 1 })

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).not.toContain(barrier.id)
    })

    it('skips a waitpoint that carries no deadline', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).not.toContain(barrier.id)
    })

    it('skips an already completed waitpoint', async () => {
        const { flowRun } = await createParentRun()
        const barrier = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            isFanIn: true,
            expectedChildren: 1,
            status: WaitpointStatus.COMPLETED,
            resumeDateTime: dayjs().subtract(5, 'minute').toISOString(),
        })
        await db.save('waitpoint', barrier)

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).not.toContain(barrier.id)
    })

    it('ignores a deadline overdue by more than the pause ceiling, so a first tick cannot backfill history', async () => {
        const { flowRun } = await createParentRun()
        const ancient = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -60 * 24 * 40, expectedChildren: 1, stepName: 'ancient' })
        const recent = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -60 * 24 * 29, expectedChildren: 1, stepName: 'recent' })

        const rearmed = await waitpointService(app.log).sweepOverdueDeadlines()

        expect(rearmed).not.toContain(ancient.id)
        expect(rearmed).toContain(recent.id)
    })

    it('leaves a deadline whose job already exhausted its attempts dead-lettered instead of re-arming it every tick', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -5, expectedChildren: 1, stepName: 'poison' })
        const jobId = resumeDelayJobId({ waitpointId: barrier.id })
        const realHandler = systemJobHandlers.getJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT)
        systemJobHandlers.registerJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT, async () => {
            throw new Error('permanently failing resume')
        })

        try {
            await systemJobsSchedule(app.log).upsertJob({
                job: {
                    name: SystemJobName.RESUME_DELAY_WAITPOINT,
                    data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
                    jobId,
                },
                schedule: { type: 'one-time', date: dayjs() },
                customConfig: { attempts: 1 },
            })
            await vi.waitFor(async () => {
                const job = await systemJobsSchedule(app.log).getJob(jobId)
                expect(await job?.isFailed()).toBe(true)
            }, { timeout: 15_000 })

            expect(await waitpointService(app.log).sweepOverdueDeadlines()).not.toContain(barrier.id)
        }
        finally {
            systemJobHandlers.registerJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT, realHandler)
        }
    })

    it('caps the batch at the newest deadlines so a stuck prefix cannot starve them, and reaches the rest once those drain', async () => {
        const { flowRun } = await createParentRun()
        const total = 501
        const waitpoints = Array.from({ length: total }, (_, index) => createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: `delay_${index}`,
            type: PauseType.DELAY,
            status: WaitpointStatus.PENDING,
            resumeDateTime: dayjs().subtract(total - index + 10_000, 'minute').toISOString(),
        }))
        await db.save('waitpoint', waitpoints)

        const firstSweep = await waitpointService(app.log).sweepOverdueDeadlines()

        expect(firstSweep).toContain(waitpoints[500].id)
        expect(firstSweep).not.toContain(waitpoints[0].id)

        await db.delete('waitpoint', firstSweep)

        expect(await waitpointService(app.log).sweepOverdueDeadlines()).toContain(waitpoints[0].id)
    })
})
