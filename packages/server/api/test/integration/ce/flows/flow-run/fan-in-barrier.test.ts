import { apId, isNil } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { ExecutionType, FlowRunStatus, FlowVersionState, PauseType, RunEnvironment, StreamStepProgress } from '@activepieces/shared'
import { Job } from 'bullmq'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { flowRunService } from '../../../../../src/app/flows/flow-run/flow-run-service'
import { maybeResumeFanInBarrier, runsMetadataQueue } from '../../../../../src/app/flows/flow-run/flow-runs-queue'
import { fanInBarrier, FanInSummary } from '../../../../../src/app/flows/flow-run/waitpoint/fan-in-barrier'
import { handleResumeDelayWaitpoint } from '../../../../../src/app/flows/flow-run/waitpoint/resume-delay-handler'
import { resumeService } from '../../../../../src/app/flows/flow-run/waitpoint/resume-service'
import { sweepOverdueDeadlines } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-deadline-sweep'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { Waitpoint, WaitpointStatus } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-types'
import { systemJobIds, SystemJobName } from '../../../../../src/app/helper/system-jobs/common'
import { systemJobHandlers } from '../../../../../src/app/helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../../../../src/app/helper/system-jobs/system-job'
import { redisMetadataKey } from '../../../../../src/app/workers/job'
import { jobQueue } from '../../../../../src/app/workers/job-queue/job-queue'
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

async function createChildren({ parentRunId, parentWaitpointId, statuses, dispatchIndices }: {
    parentRunId?: string
    parentWaitpointId?: string
    statuses: FlowRunStatus[]
    dispatchIndices?: number[]
}) {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const children = statuses.map((status, index) => ({
        ...createMockFlowRun({
            projectId: ctx.project.id,
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            status,
            parentRunId,
            parentWaitpointId,
            environment: RunEnvironment.PRODUCTION,
        }),
        dispatchIndex: dispatchIndices?.[index] ?? null,
    }))
    for (const child of children) {
        await db.save('flow_run', child)
    }
    return children
}

async function seedBarrier({ flowRunId, expectedChildren, status, resumePayload, stepName, dispatchDigest }: {
    flowRunId: string
    expectedChildren?: number | null
    status?: WaitpointStatus
    resumePayload?: Waitpoint['resumePayload']
    stepName?: string
    dispatchDigest?: string
}) {
    const waitpoint = createMockWaitpoint({
        flowRunId,
        projectId: ctx.project.id,
        stepName: stepName ?? 'fan_out',
        isFanIn: true,
        expectedChildren: expectedChildren ?? null,
        status: status ?? WaitpointStatus.PENDING,
        resumePayload: resumePayload ?? null,
        dispatchDigest: dispatchDigest ?? null,
    })
    await db.save('waitpoint', waitpoint)
    return waitpoint
}

async function findQueuedJobsForRun(runId: string): Promise<Job[]> {
    const queues = jobQueue(app.log).getAllQueues()
    const jobsPerQueue = await Promise.all(queues.map((queue) => queue.getJobs(['waiting', 'prioritized', 'delayed', 'active', 'completed', 'failed'])))
    return jobsPerQueue.flat().filter((job) => {
        const data: unknown = job.data
        return typeof data === 'object' && data !== null && 'runId' in data && data.runId === runId
    })
}

function child({ status, dispatchIndex }: { status: FlowRunStatus, dispatchIndex: number | null }) {
    return { id: apId(), status, dispatchIndex }
}

const DISPATCH_DIGEST = 'a'.repeat(64)

function createBarrier({ flowRunId, dispatchDigest, intendedChildren }: { flowRunId: string, dispatchDigest?: string, intendedChildren?: number }) {
    return waitpointService(app.log).createForPause({
        flowRunId,
        projectId: ctx.project.id,
        stepName: 'fan_out',
        type: PauseType.WEBHOOK,
        version: 'V1',
        isFanIn: true,
        dispatchDigest: dispatchDigest ?? DISPATCH_DIGEST,
        intendedChildren,
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
        const children = [
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 }),
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 1 }),
            child({ status: FlowRunStatus.FAILED, dispatchIndex: 2 }),
            child({ status: FlowRunStatus.CANCELED, dispatchIndex: 3 }),
        ]

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false, children })

        expect(summary).toEqual({
            expected: 4,
            succeeded: 2,
            failed: 1,
            canceled: 1,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 0,
            timedOut: false,
            exceptions: [{ runId: children[2].id, dispatchIndex: 2 }],
        })
    })

    it('reports items that never reached the subflow and folds them into the expected total', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 2, failedToDispatch: 1 })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }
        const children = [
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 }),
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 1 }),
        ]

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false, children })

        expect(summary).toEqual({
            expected: 3,
            succeeded: 2,
            failed: 0,
            canceled: 0,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 1,
            timedOut: false,
            exceptions: [{ runId: null, dispatchIndex: 2 }],
        })
    })

    it('reports an accepted dispatch that never produced a run as notStarted', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 3 })
        const counts = { succeeded: 1, failed: 0, canceled: 0, stillRunning: 1, terminal: 1 }
        const children = [
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 }),
            child({ status: FlowRunStatus.RUNNING, dispatchIndex: 2 }),
        ]

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: true, children })

        expect(summary.notStarted).toBe(1)
        expect(summary.expected).toBe(3)
        expect(summary.timedOut).toBe(true)
        expect(summary.exceptions).toEqual([{ runId: null, dispatchIndex: 1 }])
    })

    it('names every failed child and nothing else', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 4 })
        const counts = { succeeded: 1, failed: 2, canceled: 0, stillRunning: 1, terminal: 3 }
        const children = [
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 }),
            child({ status: FlowRunStatus.TIMEOUT, dispatchIndex: 1 }),
            child({ status: FlowRunStatus.INTERNAL_ERROR, dispatchIndex: 2 }),
            child({ status: FlowRunStatus.RUNNING, dispatchIndex: 3 }),
        ]

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: true, children })

        expect(summary.exceptions).toEqual([
            { runId: children[1].id, dispatchIndex: 1 },
            { runId: children[2].id, dispatchIndex: 2 },
        ])
    })

    it('names no child when nothing failed and nothing is missing', async () => {
        const barrier = createMockWaitpoint({ isFanIn: true, expectedChildren: 2 })
        const counts = { succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, terminal: 2 }
        const children = [
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 }),
            child({ status: FlowRunStatus.SUCCEEDED, dispatchIndex: 1 }),
        ]

        const summary = fanInBarrier.toSummary({ counts, barrier, timedOut: false, children })

        expect(summary.exceptions).toEqual([])
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

        const { inserted, waitpoint, fanIn } = await createBarrier({ flowRunId: flowRun.id })

        expect(inserted).toBe(true)
        expect(waitpoint.isFanIn).toBe(true)
        expect(waitpoint.expectedChildren).toBeNull()
        expect(waitpoint.dispatchDigest).toBe(DISPATCH_DIGEST)
        expect(fanIn).toEqual({ sealed: false, expectedChildren: null, dispatchedIndices: [] })
    })

    it('reuses the existing barrier on an idempotent re-entry before anything was dispatched', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const first = await createBarrier({ flowRunId: flowRun.id })

        const second = await createBarrier({ flowRunId: flowRun.id })

        expect(second.inserted).toBe(false)
        expect(second.waitpoint.id).toBe(first.waitpoint.id)
    })

    it('rejects a fan-in create with no dispatch digest', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)

        await expect(waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'fan_out',
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
        })).rejects.toThrow()
    })

    it('rejects a pre-flight child count over AP_MAX_FAN_IN_CHILDREN before anything is dispatched', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        process.env.AP_MAX_FAN_IN_CHILDREN = '3'

        try {
            await expect(createBarrier({ flowRunId: flowRun.id, intendedChildren: 4 })).rejects.toThrow()
            expect(await db.findOneBy('waitpoint', { flowRunId: flowRun.id })).toBeNull()
        }
        finally {
            delete process.env.AP_MAX_FAN_IN_CHILDREN
        }
    })

    it('refuses to re-enter a barrier that already dispatched children, even from the same payload', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const first = await createBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: first.waitpoint.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED] })

        await expect(createBarrier({ flowRunId: flowRun.id })).rejects.toThrow()
    })

    it('refuses to re-enter a barrier whose payload digest changed', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const first = await createBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: first.waitpoint.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await expect(createBarrier({ flowRunId: flowRun.id, dispatchDigest: 'b'.repeat(64) })).rejects.toThrow()
    })

    it('refuses to re-enter a barrier that has children but no stored digest', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

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
    async function seal({ waitpointId, expectedChildren, failedToDispatch, timeoutAt }: { waitpointId: string, expectedChildren: number, failedToDispatch?: number, timeoutAt?: string }) {
        return waitpointService(app.log).sealFanInBarrier({
            waitpointId,
            projectId: ctx.project.id,
            expectedChildren,
            failedToDispatch,
            timeoutAt: timeoutAt ?? dayjs().add(30, 'minute').toISOString(),
        })
    }

    it('rejects a seal that dispatched more children than AP_MAX_FAN_IN_CHILDREN allows', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        process.env.AP_MAX_FAN_IN_CHILDREN = '3'

        try {
            await expect(seal({ waitpointId: barrier.id, expectedChildren: 3, failedToDispatch: 1 })).rejects.toThrow()
            const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 2, failedToDispatch: 1 })
            expect(waitpoint.expectedChildren).toBe(2)
        }
        finally {
            delete process.env.AP_MAX_FAN_IN_CHILDREN
        }
    })

    it('records the expected count and schedules a timeout job keyed on the waitpoint', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })
        const timeoutAt = dayjs().add(30, 'minute').toISOString()

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 2, timeoutAt })

        expect(waitpoint.id).toBe(barrier.id)
        expect(waitpoint.expectedChildren).toBe(2)
        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
        const job = await systemJobsSchedule(app.log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(systemJobIds.resumeDelay({ waitpointId: barrier.id }))
        expect(job).toBeDefined()
        expect(job?.data.waitpointId).toBe(barrier.id)
    })

    it('seals at the platform ceiling when no timeout is requested, and reports it back', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint, timeoutAt } = await waitpointService(app.log).sealFanInBarrier({
            waitpointId: barrier.id,
            projectId: ctx.project.id,
            expectedChildren: 1,
        })

        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().add(29, 'day'))).toBe(true)
        expect(dayjs(waitpoint.resumeDateTime).isBefore(dayjs().add(31, 'day'))).toBe(true)
        expect(dayjs(timeoutAt).isSame(dayjs(waitpoint.resumeDateTime))).toBe(true)
    })

    it('reports the effective deadline of a barrier that was already sealed', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })
        const first = await seal({ waitpointId: barrier.id, expectedChildren: 1, timeoutAt: dayjs().add(30, 'minute').toISOString() })

        const second = await seal({ waitpointId: barrier.id, expectedChildren: 5, timeoutAt: dayjs().add(10, 'day').toISOString() })

        expect(second.alreadySealed).toBe(true)
        expect(second.waitpoint.expectedChildren).toBe(1)
        expect(dayjs(second.timeoutAt).isSame(dayjs(first.timeoutAt))).toBe(true)
    })

    it('still clamps an explicitly requested timeout to the maximum pause duration', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            waitpointId: barrier.id,
            expectedChildren: 1,
            timeoutAt: dayjs().add(400, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().add(29, 'day'))).toBe(true)
        expect(dayjs(waitpoint.resumeDateTime).isBefore(dayjs().add(31, 'day'))).toBe(true)
    })

    it('completes immediately without scheduling a timeout when every child is already terminal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED] })

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 2 })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary).toEqual({ expected: 2, succeeded: 1, failed: 1, canceled: 0, stillRunning: 0, notStarted: 0, failedToDispatch: 0, timedOut: false, exceptions: [{ runId: expect.any(String), dispatchIndex: null }] })
        expect(await systemJobsSchedule(app.log).getJob(systemJobIds.resumeDelay({ waitpointId: barrier.id }))).toBeUndefined()
    })

    it('names the failed child by run id and dispatch index in the released summary', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        const children = await createChildren({
            parentWaitpointId: barrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED],
            dispatchIndices: [0, 1],
        })

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 2 })

        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary.exceptions).toEqual([{ runId: children[1].id, dispatchIndex: 1 }])
    })

    it('persists the undispatched item count and reports it in the summary', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED], dispatchIndices: [0, 1] })

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 2, failedToDispatch: 1 })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        const summary = waitpoint.resumePayload?.body as FanInSummary
        expect(summary).toEqual({ expected: 3, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, notStarted: 0, failedToDispatch: 1, timedOut: false, exceptions: [{ runId: null, dispatchIndex: 2 }] })
    })

    it('does not release the second barrier of a run off the first barrier children (loop regression)', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const firstBarrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3, stepName: 'fan_out_earlier' })
        await createChildren({
            parentRunId: flowRun.id,
            parentWaitpointId: firstBarrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED],
        })

        const secondBarrier = await createBarrier({ flowRunId: flowRun.id })
        const { waitpoint } = await seal({ waitpointId: secondBarrier.waitpoint.id, expectedChildren: 3 })

        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
    })

    it('clamps a timeout beyond the maximum pause duration', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            waitpointId: barrier.id,
            expectedChildren: 1,
            timeoutAt: dayjs().add(365, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isBefore(dayjs().add(31, 'day'))).toBe(true)
        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().add(1, 'day'))).toBe(true)
    })

    it('floors a timeout that is already in the past', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        const { waitpoint } = await seal({
            waitpointId: barrier.id,
            expectedChildren: 1,
            timeoutAt: dayjs().subtract(10, 'day').toISOString(),
        })

        expect(dayjs(waitpoint.resumeDateTime).isAfter(dayjs().subtract(1, 'minute'))).toBe(true)
    })

    it('rejects an invalid timeout', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })

        await expect(seal({ waitpointId: barrier.id, expectedChildren: 1, timeoutAt: 'not-a-date' })).rejects.toThrow()
    })

    it('leaves an already completed barrier untouched on a duplicate seal', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({
            flowRunId: flowRun.id,
            expectedChildren: 2,
            status: WaitpointStatus.COMPLETED,
            resumePayload: { body: { expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false } },
        })

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 2, timeoutAt: dayjs().add(5, 'minute').toISOString() })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        expect(waitpoint.resumePayload?.body).toEqual({ expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, timedOut: false })
        expect(await systemJobsSchedule(app.log).getJob(systemJobIds.resumeDelay({ waitpointId: barrier.id }))).toBeUndefined()
    })

    it('cannot lower the expected count on a second seal, so nine unmaterialised children cannot be released away', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })
        await seal({ waitpointId: barrier.id, expectedChildren: 10 })

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 1 })

        expect(waitpoint.expectedChildren).toBe(10)
        expect(waitpoint.status).toBe(WaitpointStatus.PENDING)
    })

    it('re-evaluates the release predicate on a duplicate seal instead of failing the run', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedBarrier({ flowRunId: flowRun.id })
        const [child] = await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })
        await seal({ waitpointId: barrier.id, expectedChildren: 1 })
        await db.update('flow_run', child.id, { status: FlowRunStatus.SUCCEEDED })

        const { waitpoint } = await seal({ waitpointId: barrier.id, expectedChildren: 1 })

        expect(waitpoint.status).toBe(WaitpointStatus.COMPLETED)
        expect(waitpoint.expectedChildren).toBe(1)
    })

    it('throws when the barrier row no longer exists', async () => {
        await createParentRun(FlowRunStatus.RUNNING)

        await expect(seal({ waitpointId: apId(), expectedChildren: 1 })).rejects.toThrow()
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

    it('resumes with the stored verdict when it loses the release race, never with an empty payload', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.SUCCEEDED] })
        const winnerSummary = { expected: 2, succeeded: 2, failed: 0, canceled: 0, stillRunning: 0, notStarted: 0, failedToDispatch: 0, timedOut: false, exceptions: [] }
        const countChildren = fanInBarrier.countChildren
        const spy = vi.spyOn(fanInBarrier, 'countChildren').mockImplementation(async (params) => {
            const counts = await countChildren(params)
            await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: barrier.id,
                resumePayload: { body: winnerSummary, headers: {}, queryParams: {} },
            })
            return counts
        })

        try {
            await handleResumeDelayWaitpoint({
                data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
                log: app.log,
            })
        }
        finally {
            spy.mockRestore()
        }

        const jobs = await findQueuedJobsForRun(flowRun.id)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].data).not.toMatchObject({ payload: { type: 'inline', value: null } })
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

    it('refuses a service-level resume that does not declare it is releasing the barrier', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING, FlowRunStatus.RUNNING] })

        const { stale } = await resumeService(app.log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: barrier.id,
            resumePayload: null,
        })

        expect(stale).toBe(true)
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
        await waitpointService(app.log).sealFanInBarrier({
            waitpointId: first.id,
            projectId: ctx.project.id,
            expectedChildren: 1,
            timeoutAt: dayjs().add(60, 'minute').toISOString(),
        })
        expect(await systemJobsSchedule(app.log).getJob(systemJobIds.resumeDelay({ waitpointId: first.id }))).toBeDefined()

        await waitpointService(app.log).delete({ id: first.id, projectId: ctx.project.id })

        expect(await systemJobsSchedule(app.log).getJob(systemJobIds.resumeDelay({ waitpointId: first.id }))).toBeUndefined()

        const second = await seedBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: second.id, statuses: [FlowRunStatus.RUNNING] })
        await waitpointService(app.log).sealFanInBarrier({
            waitpointId: second.id,
            projectId: ctx.project.id,
            expectedChildren: 1,
            timeoutAt: dayjs().add(60, 'minute').toISOString(),
        })

        const job = await systemJobsSchedule(app.log).getJob<SystemJobName.RESUME_DELAY_WAITPOINT>(systemJobIds.resumeDelay({ waitpointId: second.id }))
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

        await waitpointService(app.log).delete({ id: barrier.id, projectId: ctx.project.id })

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

        await waitpointService(app.log).delete({ id: barrier.id, projectId: ctx.project.id })

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
        expect(await systemJobsSchedule(app.log).getJob(systemJobIds.resumeDelay({ waitpointId: barrier.id }))).toBeUndefined()

        expect(await sweepOverdueDeadlines({ log: app.log })).toContain(barrier.id)

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

        expect(await sweepOverdueDeadlines({ log: app.log })).toContain(waitpoint.id)
    })

    it('skips a waitpoint whose run is no longer paused', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -5, expectedChildren: 1 })

        expect(await sweepOverdueDeadlines({ log: app.log })).not.toContain(barrier.id)
    })

    it('skips a deadline that has not passed yet', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: 30, expectedChildren: 1 })

        expect(await sweepOverdueDeadlines({ log: app.log })).not.toContain(barrier.id)
    })

    it('skips a waitpoint that carries no deadline', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })

        expect(await sweepOverdueDeadlines({ log: app.log })).not.toContain(barrier.id)
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

        expect(await sweepOverdueDeadlines({ log: app.log })).not.toContain(barrier.id)
    })

    it('ignores a deadline overdue by more than the pause ceiling, so a first tick cannot backfill history', async () => {
        const { flowRun } = await createParentRun()
        const ancient = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -60 * 24 * 40, expectedChildren: 1, stepName: 'ancient' })
        const recent = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -60 * 24 * 29, expectedChildren: 1, stepName: 'recent' })

        const rearmed = await sweepOverdueDeadlines({ log: app.log })

        expect(rearmed).not.toContain(ancient.id)
        expect(rearmed).toContain(recent.id)
    })

    it('leaves a deadline whose job already exhausted its attempts dead-lettered instead of re-arming it every tick', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedDeadline({ flowRunId: flowRun.id, minutesFromNow: -5, expectedChildren: 1, stepName: 'poison' })
        const jobId = systemJobIds.resumeDelay({ waitpointId: barrier.id })
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

            expect(await sweepOverdueDeadlines({ log: app.log })).not.toContain(barrier.id)
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

        const firstSweep = await sweepOverdueDeadlines({ log: app.log })

        expect(firstSweep).toContain(waitpoints[500].id)
        expect(firstSweep).not.toContain(waitpoints[0].id)

        await db.delete('waitpoint', firstSweep)

        expect(await sweepOverdueDeadlines({ log: app.log })).toContain(waitpoints[0].id)
    })
})

describe('fan-in release wide events', () => {
    function captureWideEvents() {
        const captured: CapturedWideEvent[] = []
        const original = wideEvent.set
        vi.spyOn(wideEvent, 'set').mockImplementation((fields) => {
            captured.push({ fields: structuredClone(fields), inScope: !isNil(wideEvent.current()) })
            original(fields)
        })
        return captured
    }

    function releasesOf({ captured, barrierId }: { captured: CapturedWideEvent[], barrierId: string }) {
        return captured
            .map((event) => ({ fanIn: event.fields.fanIn, inScope: event.inScope }))
            .filter((event): event is { fanIn: Record<string, unknown>, inScope: boolean } =>
                typeof event.fanIn === 'object'
                && !isNil(event.fanIn)
                && 'releaseReason' in event.fanIn
                && event.fanIn.barrierId === barrierId)
    }

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('emits one event naming the predicate when the last child goes terminal', async () => {
        const captured = captureWideEvents()
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.FAILED] })

        await maybeResumeFanInBarrier({ parentWaitpointId: barrier.id, projectId: ctx.project.id, log: app.log })

        expect(releasesOf({ captured, barrierId: barrier.id }).map((event) => event.fanIn)).toEqual([{
            barrierId: barrier.id,
            expectedChildren: 2,
            releaseReason: 'predicate',
            stragglers: 0,
        }])
    })

    it('emits one event naming the timeout, carrying the children it left running', async () => {
        const captured = captureWideEvents()
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 3 })
        await createChildren({
            parentWaitpointId: barrier.id,
            statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING, FlowRunStatus.RUNNING],
        })

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(releasesOf({ captured, barrierId: barrier.id }).map((event) => event.fanIn)).toEqual([{
            barrierId: barrier.id,
            expectedChildren: 3,
            releaseReason: 'timeout',
            stragglers: 2,
        }])
    })

    it('emits one event naming the seal when every child is already terminal', async () => {
        const captured = captureWideEvents()
        const { flowRun } = await createParentRun()
        const { waitpoint: barrier } = await createBarrier({ flowRunId: flowRun.id })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })

        await waitpointService(app.log).sealFanInBarrier({
            waitpointId: barrier.id,
            projectId: ctx.project.id,
            expectedChildren: 1,
        })

        expect(releasesOf({ captured, barrierId: barrier.id }).map((event) => event.fanIn)).toEqual([{
            barrierId: barrier.id,
            expectedChildren: 1,
            releaseReason: 'seal',
            stragglers: 0,
        }])
    })

    it('emits nothing from the deadline sweep, which only re-arms the queued job', async () => {
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        await db.update('waitpoint', barrier.id, { resumeDateTime: dayjs().subtract(5, 'minute').toISOString() })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED] })
        const realHandler = systemJobHandlers.getJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT)
        systemJobHandlers.registerJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT, async () => {})
        const captured = captureWideEvents()

        try {
            expect(await sweepOverdueDeadlines({ log: app.log })).toContain(barrier.id)

            expect(releasesOf({ captured, barrierId: barrier.id })).toEqual([])
        }
        finally {
            systemJobHandlers.registerJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT, realHandler)
        }
    })

    it('reaches the logs from the runs-metadata worker, which opens a scope of its own', async () => {
        const captured = captureWideEvents()
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 1 })
        const [child] = await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.RUNNING] })

        await runsMetadataQueue(app.log).add({ id: child.id, projectId: ctx.project.id, status: FlowRunStatus.SUCCEEDED })

        await vi.waitFor(() => {
            expect(releasesOf({ captured, barrierId: barrier.id })).toEqual([{
                fanIn: { barrierId: barrier.id, expectedChildren: 1, releaseReason: 'predicate', stragglers: 0 },
                inScope: true,
            }])
        }, { timeout: 15_000 })
    })

    it('reaches the logs from the system-jobs worker, which opens a scope of its own', async () => {
        const captured = captureWideEvents()
        const { flowRun } = await createParentRun()
        const barrier = await seedBarrier({ flowRunId: flowRun.id, expectedChildren: 2 })
        await createChildren({ parentWaitpointId: barrier.id, statuses: [FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING] })

        await systemJobsSchedule(app.log).upsertJob({
            job: {
                name: SystemJobName.RESUME_DELAY_WAITPOINT,
                data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
                jobId: systemJobIds.resumeDelay({ waitpointId: barrier.id }),
            },
            schedule: { type: 'one-time', date: dayjs() },
        })

        await vi.waitFor(() => {
            expect(releasesOf({ captured, barrierId: barrier.id })).toEqual([{
                fanIn: { barrierId: barrier.id, expectedChildren: 2, releaseReason: 'timeout', stragglers: 1 },
                inScope: true,
            }])
        }, { timeout: 15_000 })
    })
})

describe('per-child barrier attribution', () => {
    it('travels on the child flow-run job so every child of a barrier shares one filter', async () => {
        const { flow, flowVersion } = await createParentRun()
        const parentWaitpointId = apId()

        const child = await flowRunService(app.log).start({
            flowId: flow.id,
            projectId: ctx.project.id,
            flowVersionId: flowVersion.id,
            platformId: ctx.platform.id,
            environment: RunEnvironment.PRODUCTION,
            executionType: ExecutionType.BEGIN,
            payload: {},
            parentWaitpointId,
            failParentOnFailure: true,
            executeTrigger: false,
            workerHandlerId: undefined,
            httpRequestId: undefined,
            streamStepProgress: StreamStepProgress.NONE,
        })

        const [job] = await findQueuedJobsForRun(child.id)
        expect(job.data).toMatchObject({ parentWaitpointId })
    })
})

type CapturedWideEvent = {
    fields: Record<string, unknown>
    inScope: boolean
}
