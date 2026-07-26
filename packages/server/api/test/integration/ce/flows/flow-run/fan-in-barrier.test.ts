import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { maybeResumeFanInBarrier } from '../../../../../src/app/flows/flow-run/flow-runs-queue'
import { fanInBarrier, FanInSummary } from '../../../../../src/app/flows/flow-run/waitpoint/fan-in-barrier'
import { handleResumeDelayWaitpoint } from '../../../../../src/app/flows/flow-run/waitpoint/resume-delay-handler'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { Waitpoint, WaitpointStatus } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-types'
import { resumeDelayJobId, SystemJobName } from '../../../../../src/app/helper/system-jobs/common'
import { systemJobsSchedule } from '../../../../../src/app/helper/system-jobs/system-job'
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

async function createChildren({ parentRunId, statuses }: { parentRunId: string, statuses: FlowRunStatus[] }) {
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
        environment: RunEnvironment.PRODUCTION,
    }))
    for (const child of children) {
        await db.save('flow_run', child)
    }
    return children
}

async function seedBarrier({ flowRunId, expectedChildren, baseline, status, resumePayload }: {
    flowRunId: string
    expectedChildren?: number | null
    baseline?: { succeeded: number, failed: number, canceled: number } | null
    status?: WaitpointStatus
    resumePayload?: Waitpoint['resumePayload']
}) {
    const waitpoint = createMockWaitpoint({
        flowRunId,
        projectId: ctx.project.id,
        stepName: 'fan_out',
        isFanIn: true,
        expectedChildren: expectedChildren ?? null,
        fanInBaseline: baseline ?? null,
        status: status ?? WaitpointStatus.PENDING,
        resumePayload: resumePayload ?? null,
    })
    await db.save('waitpoint', waitpoint)
    return waitpoint
}

describe('fanInBarrier predicate', () => {
    it('classifies every terminal status into the right bucket', async () => {
        const { flowRun } = await createParentRun()
        await createChildren({
            parentRunId: flowRun.id,
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

        const counts = await fanInBarrier.countChildren({ parentRunId: flowRun.id })

        expect(counts.succeeded).toBe(1)
        expect(counts.failed).toBe(6)
        expect(counts.canceled).toBe(1)
        expect(counts.stillRunning).toBe(3)
        expect(counts.terminal).toBe(8)
    })

    it('ignores children of another parent and the parent itself', async () => {
        const { flowRun } = await createParentRun()
        const { flowRun: otherParent } = await createParentRun()
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })
        await createChildren({ parentRunId: otherParent.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED] })

        const counts = await fanInBarrier.countChildren({ parentRunId: flowRun.id })

        expect(counts.terminal).toBe(1)
        expect(counts.succeeded).toBe(1)
    })

    it('counts archived children', async () => {
        const { flowRun } = await createParentRun()
        const [child] = await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })
        await db.update('flow_run', child.id, { archivedAt: dayjs().toISOString() })

        const counts = await fanInBarrier.countChildren({ parentRunId: flowRun.id })

        expect(counts.succeeded).toBe(1)
    })

    it('is not releasable while unsealed, even when every child is terminal', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: null, fanInBaseline: null })
        const counts = { succeeded: 3, failed: 0, canceled: 0, stillRunning: 0, terminal: 3 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(false)
    })

    it('is not releasable while any child is non-terminal', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 3, fanInBaseline: null })
        const counts = { succeeded: 3, failed: 0, canceled: 0, stillRunning: 1, terminal: 3 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(false)
    })

    it('is not releasable while the baseline-adjusted terminal count is short', async () => {
        const barrier = createMockWaitpoint({
            isFanIn: true,
            expectedChildren: 3,
            fanInBaseline: { succeeded: 3, failed: 0, canceled: 0 },
        })
        const counts = { succeeded: 5, failed: 0, canceled: 0, stillRunning: 0, terminal: 5 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(false)
    })

    it('is releasable for an empty fan-out', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 0, fanInBaseline: null })
        const counts = { succeeded: 0, failed: 0, canceled: 0, stillRunning: 0, terminal: 0 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(true)
    })

    it('subtracts the baseline from each reported bucket', async () => {
        const barrier = createMockWaitpoint({
            isFanIn: true,
            expectedChildren: 3,
            fanInBaseline: { succeeded: 2, failed: 1, canceled: 0 },
        })
        const counts = { succeeded: 4, failed: 2, canceled: 1, stillRunning: 0, terminal: 7 }

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false })

        expect(summary).toEqual({
            expected: 3,
            succeeded: 2,
            failed: 1,
            canceled: 1,
            stillRunning: 0,
            failedToDispatch: 0,
            timedOut: false,
        })
    })

    it('reports items that never reached the subflow and folds them into the expected total', async () => {
        const barrier = createMockWaitpoint({
            isFanIn: true,
            expectedChildren: 2,
            failedToDispatch: 1,
            fanInBaseline: null,
        })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false })

        expect(summary).toEqual({
            expected: 3,
            succeeded: 2,
            failed: 0,
            canceled: 0,
            stillRunning: 0,
            failedToDispatch: 1,
            timedOut: false,
        })
    })

    it('releases on the dispatched count, not on the requested count', async () => {
        const barrier = createMockWaitpoint({
            isFanIn: true,
            expectedChildren: 2,
            failedToDispatch: 1,
            fanInBaseline: null,
        })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }

        expect(fanInBarrier.isReleasable({ counts, barrier })).toBe(true)
    })
})

describe('createFanInBarrier', () => {
    it('snapshots the terminal children present at create as the baseline', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await createChildren({
            parentRunId: flowRun.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
        })

        const { inserted, waitpoint } = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })

        expect(inserted).toBe(true)
        expect(waitpoint.isFanIn).toBe(true)
        expect(waitpoint.expectedChildren).toBeNull()
        expect(waitpoint.fanInBaseline).toEqual({ succeeded: 2, failed: 1, canceled: 0 })
    })

    it('reuses the existing barrier on an idempotent re-entry before anything was dispatched', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })
        const first = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })

        const second = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })

        expect(second.inserted).toBe(false)
        expect(second.waitpoint.id).toBe(first.waitpoint.id)
        expect(second.waitpoint.fanInBaseline).toEqual(first.waitpoint.fanInBaseline)
    })

    it('refuses to re-enter a barrier whose previous attempt already dispatched children', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })

        await expect(waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })).rejects.toThrow()
    })

    it('refuses to re-enter a barrier whose previously dispatched children already finished', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await expect(waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })).rejects.toThrow()
    })

    it('throws when the run still has a non-terminal child', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING] })

        await expect(waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })).rejects.toThrow()
    })

    it('discards an unsealed barrier leaked by an earlier step of the same run', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const leaked = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out_earlier',
            isFanIn: true,
            expectedChildren: null,
        })
        await db.save('waitpoint', leaked)

        await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })

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

        const { inserted, waitpoint } = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })

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
        const barrier = await seedBarrier({ flowRunId: flowRun.id, baseline: { succeeded: 0, failed: 0, canceled: 0 } })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })
        const timeoutAt = dayjs().add(30, 'minute').toISOString()

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, resumeDateTime: timeoutAt })

        expect(waitpoint.id).toBe(barrier.id)
        expect(waitpoint.expectedChildren).toBe(2)
        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
        const job = await systemJobsSchedule(app.log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(resumeDelayJobId({ waitpointId: barrier.id }))
        expect(job).toBeDefined()
        expect(job?.data.waitpointId).toBe(barrier.id)
    })

    it('completes immediately without scheduling a timeout when every child is already terminal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id, baseline: { succeeded: 0, failed: 0, canceled: 0 } })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED] })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary).toEqual({ expected: 2, succeeded: 1, failed: 1, canceled: 0, stillRunning: 0, failedToDispatch: 0, timedOut: false })
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: barrier.id }))).toBeUndefined()
    })

    it('persists the undispatched item count and reports it in the summary', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await seedBarrier({ flowRunId: flowRun.id, baseline: { succeeded: 0, failed: 0, canceled: 0 } })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, failedToDispatch: 1 })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary).toEqual({ expected: 3, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, failedToDispatch: 1, timedOut: false })
    })

    it('does not release the second barrier of a run off the first barrier children (loop regression)', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await createChildren({
            parentRunId: flowRun.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED],
        })

        const created = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })
        expect(created.waitpoint.fanInBaseline).toEqual({ succeeded: 3, failed: 0, canceled: 0 })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 3, resumeDateTime: dayjs().add(30, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
    })

    it('clamps a timeout beyond the maximum pause duration', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await seedBarrier({ flowRunId: flowRun.id, baseline: { succeeded: 0, failed: 0, canceled: 0 } })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING] })

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
        await seedBarrier({ flowRunId: flowRun.id, baseline: { succeeded: 0, failed: 0, canceled: 0 } })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            resumeDateTime: dayjs().subtract(10, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().subtract(1, 'minute'))).toBe(true)
    })

    it('rejects an invalid timeout', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await seedBarrier({ flowRunId: flowRun.id, baseline: { succeeded: 0, failed: 0, canceled: 0 } })

        await expect(seal({ flowRunId: flowRun.id, expectedChildren: 1, resumeDateTime: 'not-a-date' })).rejects.toThrow()
    })

    it('leaves an already completed barrier untouched on a duplicate seal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: { expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false } },
        })

        const { waitpoint } = await seal({ flowRunId: flowRun.id, expectedChildren: 2, resumeDateTime: dayjs().add(5, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        expect(waitpoint.resumePayload?.body).toEqual({ expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false })
        expect(await systemJobsSchedule(app.log).getJob(resumeDelayJobId({ waitpointId: barrier.id }))).toBeUndefined()
    })

    it('throws when the barrier row no longer exists', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)

        await expect(seal({ flowRunId: flowRun.id, expectedChildren: 1 })).rejects.toThrow()
    })
})

describe('maybeResumeFanInBarrier', () => {
    it('completes the barrier once the last child reaches a terminal state', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 3,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        await createChildren({
            parentRunId: flowRun.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED, FlowRunStatus.CANCELED],
        })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('does nothing while children are still running', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 3,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        await createChildren({
            parentRunId: flowRun.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING],
        })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        const stored = await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })
        expect(stored.status).toBe(WaitpointStatus.PENDING)
    })

    it('blocks release while a child is being retried in place, then releases once it finishes', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 3,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        const children = await createChildren({
            parentRunId: flowRun.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
        })
        await db.update('flow_run', children[2].id, { status: FlowRunStatus.QUEUED })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)

        await db.update('flow_run', children[2].id, { status: FlowRunStatus.SUCCEEDED })
        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('waits for an extra child created by a retry on the latest version', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 3,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        await createChildren({
            parentRunId: flowRun.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
        })
        const [retry] = await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING] })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })
        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)

        await db.update('flow_run', retry.id, { status: FlowRunStatus.SUCCEEDED })
        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('recovers a barrier that was completed without a resume reaching the queue', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: { expected: 1, succeeded: 1, failed: 0, canceled: 0, stillRunning: 0, timedOut: false } },
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('leaves a completed barrier alone while the parent has not persisted PAUSED yet', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
            status: WaitpointStatus.COMPLETED,
        })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).not.toBeNull()
    })

    it('does nothing when the parent run is already terminal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.SUCCEEDED)
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('does nothing when the run has no fan-in barrier', async () => {
        const { flowRun } = await createParentRun()
        const waitpoint = createMockWaitpoint({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            isFanIn: false,
        })
        await db.save('waitpoint', waitpoint)

        await maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log })

        expect((await db.findOneByOrFail<Waitpoint>('waitpoint', { id: waitpoint.id })).status).toBe(WaitpointStatus.PENDING)
    })

    it('releases exactly once under concurrent evaluation', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })

        await Promise.all([
            maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log }),
            maybeResumeFanInBarrier({ parentRunId: flowRun.id, log: app.log }),
        ])

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })
})

describe('handleResumeDelayWaitpoint', () => {
    it('times out a barrier and reports the stragglers without touching them', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        const children = await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING] })

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
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
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
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(await db.findOneBy('waitpoint', { id: barrier.id })).not.toBeNull()
    })
})

describe('timeout job lifecycle', () => {
    it('frees the job id so a later barrier in the same run gets its own timeout', async () => {
        const { flowRun } = await createParentRun()
        const first = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
        await createChildren({ parentRunId: flowRun.id, statuses: [FlowRunStatus.RUNNING] })
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

        const second = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: null, baseline: { succeeded: 0, failed: 0, canceled: 0 } })
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
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
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
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 1,
            baseline: { succeeded: 0, failed: 0, canceled: 0 },
        })
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
