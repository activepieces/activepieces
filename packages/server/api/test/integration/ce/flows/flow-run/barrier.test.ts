import { apId, assertNotNullOrUndefined, isNil } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { BarrierSignalStatus, BarrierSummary, ErrorCode, FlowActionType, FlowRunStatus, FlowTrigger, FlowTriggerType, FlowVersionState, MAX_SIGNAL_REASON_LENGTH, PauseType, RunEnvironment } from '@activepieces/shared'
import { Queue, UnrecoverableError } from 'bullmq'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { transaction } from '../../../../../src/app/core/db/transaction'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { distributedStore, redisConnections } from '../../../../../src/app/database/redis-connections'
import { childRunDispatchService } from '../../../../../src/app/flows/flow-run/child-run-dispatch-service'
import { systemJobIds, SystemJobName } from '../../../../../src/app/helper/system-jobs/common'
import { systemJobsQueue, systemJobsSchedule } from '../../../../../src/app/helper/system-jobs/system-job'
import * as billingProviderModule from '../../../../../src/app/platform/billing-provider'
import { platformConfigurationService } from '../../../../../src/app/platform/platform-configuration.service'
import { barrierQueue } from '../../../../../src/app/waitpoints/barrier-queue'
import * as barrierQueueModule from '../../../../../src/app/waitpoints/barrier-queue'
import { BarrierJobData, BarrierJobName, barrierSourceKey } from '../../../../../src/app/waitpoints/barrier-queue-factory'
import { barrierService } from '../../../../../src/app/waitpoints/barrier-service'
import * as barrierServiceModule from '../../../../../src/app/waitpoints/barrier-service'
import { fanOutDispatchGaveUp, handleFanOutDispatch, handleFanOutDispatchFailed, handleFanOutDispatchGaveUp } from '../../../../../src/app/waitpoints/fan-out-dispatcher-job'
import { handleResumeDelayWaitpoint } from '../../../../../src/app/waitpoints/resume-delay-handler'
import { resumeService } from '../../../../../src/app/waitpoints/resume-service'
import { BARRIER_RECOVERY_CURSOR_KEY, DEADLINE_SWEEP_CURSOR_KEY, sweepOverdueDeadlines } from '../../../../../src/app/waitpoints/waitpoint-deadline-sweep'
import { waitpointService } from '../../../../../src/app/waitpoints/waitpoint-service'
import { waitpointTimeoutJob } from '../../../../../src/app/waitpoints/waitpoint-timeout-job'
import { Waitpoint, WaitpointStatus } from '../../../../../src/app/waitpoints/waitpoint-types'
import * as jobQueueModule from '../../../../../src/app/workers/job-queue/job-queue'
import { jobQueue } from '../../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

const FAN_OUT_ENTRY_STEP = 'step_1'

const FAN_OUT_BATCH_STEP = 'fan_out'

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
    return saveParentRun({ status })
}

async function createFanOutParentRun(status: FlowRunStatus = FlowRunStatus.PAUSED) {
    const now = dayjs().toISOString()
    return saveParentRun({
        status,
        trigger: {
            type: FlowTriggerType.EMPTY,
            name: 'trigger',
            displayName: 'Trigger',
            valid: true,
            settings: {},
            lastUpdatedDate: now,
            nextAction: {
                type: FlowActionType.CODE,
                name: FAN_OUT_ENTRY_STEP,
                displayName: 'Batch body',
                valid: true,
                skip: false,
                lastUpdatedDate: now,
                settings: {
                    sourceCode: { code: 'export const code = async () => true', packageJson: '{}' },
                    input: {},
                },
            },
        },
    })
}

async function saveParentRun({ status, trigger }: { status: FlowRunStatus, trigger?: FlowTrigger }) {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, trigger })
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

async function createBarrier({ flowRunId, signalLabels, policy, stepName }: {
    flowRunId: string
    signalLabels: (string | null)[]
    policy?: { requiredSuccesses?: number, releaseOnFirstFailure?: boolean }
    stepName?: string
}) {
    return barrierService(app.log).create({
        flowRunId,
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        stepName: stepName ?? 'approval',
        version: 'V1',
        policy,
        signalLabels,
    })
}

async function listSignals(barrierId: string) {
    return databaseConnection().getRepository('waitpoint_signal').findBy({ waitpointId: barrierId })
}

async function readSummary(barrierId: string): Promise<BarrierSummary> {
    const barrier = await databaseConnection().getRepository('waitpoint').findOneByOrFail({ id: barrierId })
    return BarrierSummary.parse(barrier.resumePayload?.body)
}

async function receiveSignal({ signalId, status, result }: { signalId: string, status: BarrierSignalStatus, result?: Record<string, unknown> }) {
    return barrierService(app.log).receiveSignal({ signalId, projectId: ctx.project.id, status, result })
}

async function releaseIfReady(barrierId: string) {
    return barrierService(app.log).releaseIfReady({ barrierId, projectId: ctx.project.id })
}

async function releaseNow(barrier: Waitpoint) {
    return barrierService(app.log).release({ barrier, timedOut: false, releaseReason: 'predicate' })
}

async function completeWithoutConsuming(barrierId: string) {
    await databaseConnection().getRepository('waitpoint').update({ id: barrierId }, {
        status: WaitpointStatus.COMPLETED,
        resumePayload: { body: { total: 1 }, headers: {}, queryParams: {} },
    })
    await databaseConnection().getRepository('waitpoint_signal').delete({ waitpointId: barrierId })
}

async function countPendingEvaluations({ queue, barrierId }: { queue: Queue<BarrierJobData>, barrierId: string }): Promise<number> {
    const jobs = await queue.getJobs(['waiting', 'delayed', 'prioritized', 'paused'])
    return jobs.filter((job) => job.data.barrierId === barrierId).length
}

async function drainEvaluations(queue: Queue<BarrierJobData>): Promise<void> {
    const jobs = await queue.getJobs(['waiting', 'delayed', 'prioritized', 'paused'])
    await Promise.all(jobs.map((job) => job.remove()))
}

async function closeWithoutConsuming(barrierId: string) {
    await databaseConnection().getRepository('waitpoint').update({ id: barrierId }, {
        status: WaitpointStatus.COMPLETED,
        resumePayload: {
            body: {
                total: 1,
                succeeded: 1,
                failed: 0,
                rejected: 0,
                canceled: 0,
                notDispatched: 0,
                stillRunning: 0,
                timedOut: false,
                signals: [],
            },
            headers: {},
            queryParams: {},
        },
    })
    await databaseConnection().getRepository('waitpoint_signal').delete({ waitpointId: barrierId })
}

async function listResumeJobs(flowRunId: string) {
    const queue = jobQueue(app.log).getSharedQueue()
    const jobs = await queue.getJobs(['waiting', 'delayed', 'prioritized', 'paused', 'active'])
    return jobs.filter((job) => job.id?.startsWith(`${flowRunId}-resume-`))
}

async function dropResumeJobs(flowRunId: string) {
    const jobs = await listResumeJobs(flowRunId)
    await Promise.all(jobs.map((job) => job.remove()))
}

async function giveUp(barrierId: string) {
    return handleFanOutDispatchGaveUp({ data: { barrierId, projectId: ctx.project.id }, log: app.log })
}

async function failDispatch({ barrierId, attemptsMade }: { barrierId: string, attemptsMade: number }) {
    return handleFanOutDispatchFailed({
        data: { barrierId, projectId: ctx.project.id },
        attemptsMade,
        attempts: 5,
        error: new Error('worker died'),
        log: app.log,
    })
}

async function createFanOutBarrier({ flowRunId, items, batchSize, stepName, batchStepName }: {
    flowRunId: string
    items: unknown[]
    batchSize: number
    stepName?: string
    batchStepName?: string
}) {
    return barrierService(app.log).create({
        flowRunId,
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        stepName: stepName ?? FAN_OUT_BATCH_STEP,
        version: 'V1',
        fanOut: {
            entryStepName: FAN_OUT_ENTRY_STEP,
            batchStepName: batchStepName ?? FAN_OUT_BATCH_STEP,
            batchSize,
            items,
            seedSteps: {},
        },
    })
}

async function withBarrierQueuePaused<T>(fn: () => Promise<T>): Promise<T> {
    const queue = barrierQueue(app.log).get()
    await queue.pause()
    try {
        await queue.drain(true)
        return await fn()
    }
    finally {
        await queue.resume()
    }
}

async function listChildren(barrierId: string) {
    return databaseConnection().getRepository('flow_run').findBy({ parentWaitpointId: barrierId })
}

async function dispatch(barrierId: string) {
    return handleFanOutDispatch({ data: { barrierId, projectId: ctx.project.id }, log: app.log })
}

async function claimChunk({ barrierId, flowRunId, limit }: { barrierId: string, flowRunId: string, limit: number }) {
    const target = await childRunDispatchService(app.log).prepareChildDispatch({ projectId: ctx.project.id, parentRunId: flowRunId, entryStepName: FAN_OUT_ENTRY_STEP })
    return transaction(async (entityManager) => {
        const claimResult = await barrierService(app.log).claimNextSignals({ barrierId, projectId: ctx.project.id, afterSequence: -1, limit, entityManager })
        if (!claimResult.barrierOpen) {
            return null
        }
        const childRuns = await childRunDispatchService(app.log).createChildRuns({
            target,
            parentWaitpointId: barrierId,
            children: claimResult.claims.map((claim) => ({ id: claim.childRunId, dispatchIndex: claim.sequence })),
            entityManager,
        })
        return { claims: claimResult.claims, childRuns }
    })
}

function failNextChildEnqueue({ beforeFailure }: { beforeFailure?: () => Promise<unknown> }) {
    const realJobQueue = jobQueueModule.jobQueue
    const add = vi.fn(async (...args: Parameters<ReturnType<typeof realJobQueue>['add']>) => {
        if (add.mock.calls.length === 1) {
            await beforeFailure?.()
            throw new Error('redis is down')
        }
        return realJobQueue(app.log).add(...args)
    })
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...realJobQueue(log), add }))
}

async function dispatchReadingChildPayloads(barrierId: string) {
    const realJobQueue = jobQueueModule.jobQueue
    const add = vi.fn(async (...args: Parameters<ReturnType<typeof realJobQueue>['add']>) => realJobQueue(app.log).add(...args))
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...realJobQueue(log), add }))
    try {
        await dispatch(barrierId)
        return add.mock.calls.map(([job]) => 'payload' in job.data ? job.data.payload : null)
    }
    finally {
        vi.restoreAllMocks()
    }
}

async function waitFor(condition: () => Promise<boolean>): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await condition()) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('Timed out waiting for the barrier to settle')
}

const PAUSE_TIMEOUT_DAYS = Number(process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS ?? '30')

async function readStatus(barrierId: string): Promise<WaitpointStatus> {
    const barrier = await db.findOneByOrFail<{ status: WaitpointStatus }>('waitpoint', { id: barrierId })
    return barrier.status
}

async function recoverUndeliveredResume(flowRunId: string) {
    const undelivered = await waitpointService(app.log).findUndeliveredCompletedWaitpoint({ flowRunId, projectId: ctx.project.id })
    if (isNil(undelivered)) {
        return null
    }
    await resumeService(app.log).resumeTrustedWithoutLock({
        flowRunId,
        waitpointId: undelivered.id,
        resumePayload: undelivered.resumePayload,
    })
    return undelivered
}

describe('barrier release predicate', () => {
    it('releases once every signal has been received, and not before', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })
        const signals = await listSignals(barrier.id)
        expect(signals).toHaveLength(2)

        await receiveSignal({ signalId: signals[0].id, status: BarrierSignalStatus.SUCCEEDED })
        await releaseIfReady(barrier.id)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)

        await receiveSignal({ signalId: signals[1].id, status: BarrierSignalStatus.SUCCEEDED })
        await releaseIfReady(barrier.id)

        const summary = await readSummary(barrier.id)
        expect(summary).toMatchObject({ total: 2, succeeded: 2, failed: 0, stillRunning: 0, timedOut: false })
        expect(await listSignals(barrier.id)).toHaveLength(0)
    })

    it('releases early once requiredSuccesses favourable signals have landed', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({
            flowRunId: flowRun.id,
            signalLabels: ['a@example.com', 'b@example.com', 'c@example.com'],
            policy: { requiredSuccesses: 2 },
        })
        const signals = await listSignals(barrier.id)

        await receiveSignal({ signalId: signals[0].id, status: BarrierSignalStatus.SUCCEEDED })
        await releaseIfReady(barrier.id)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)

        await receiveSignal({ signalId: signals[1].id, status: BarrierSignalStatus.SUCCEEDED })
        await releaseIfReady(barrier.id)

        const summary = await readSummary(barrier.id)
        expect(summary).toMatchObject({ total: 3, succeeded: 2, stillRunning: 1 })
    })

    it('releases on the first unfavourable signal when releaseOnFirstFailure is set', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({
            flowRunId: flowRun.id,
            signalLabels: ['a@example.com', 'b@example.com', 'c@example.com'],
            policy: { releaseOnFirstFailure: true },
        })
        const signals = await listSignals(barrier.id)

        await receiveSignal({ signalId: signals[0].id, status: BarrierSignalStatus.REJECTED })
        await releaseIfReady(barrier.id)

        const summary = await readSummary(barrier.id)
        expect(summary).toMatchObject({ total: 3, rejected: 1, stillRunning: 2 })
    })

    it('reports the inline signals so every awaited thing is named, not only the failures', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })
        const signals = await listSignals(barrier.id)

        await receiveSignal({ signalId: signals[0].id, status: BarrierSignalStatus.SUCCEEDED })
        await receiveSignal({ signalId: signals[1].id, status: BarrierSignalStatus.FAILED, result: { reason: 'nope' } })
        await releaseIfReady(barrier.id)

        const summary = await readSummary(barrier.id)
        expect(summary.failed).toBe(1)
        expect(summary.signals?.map((signal) => signal.label).sort()).toEqual(['a@example.com', 'b@example.com'])
        expect(summary.signals?.map((signal) => signal.outcome).sort()).toEqual([BarrierSignalStatus.FAILED, BarrierSignalStatus.SUCCEEDED])
    })
})

describe('signal identity', () => {
    it('rejects a second signal on the same (waitpointId, sequence)', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        const row = {
            waitpointId: barrier.id,
            projectId: ctx.project.id,
            status: BarrierSignalStatus.PENDING,
            refId: null,
            sequence: 0,
            label: null,
            result: null,
        }
        await databaseConnection().getRepository('waitpoint_signal').insert({ id: apId(), ...row })

        await expect(databaseConnection().getRepository('waitpoint_signal').insert({ id: apId(), ...row })).rejects.toThrow()
    })

    it('lets two null sequences coexist on one barrier', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        const signals = await listSignals(barrier.id)
        expect(signals).toHaveLength(2)
        expect(signals.every((signal) => signal.sequence === null)).toBe(true)
    })

    it('overwrites the outcome when the same signal is received twice', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })
        const [signal] = await listSignals(barrier.id)

        await receiveSignal({ signalId: signal.id, status: BarrierSignalStatus.FAILED })
        await receiveSignal({ signalId: signal.id, status: BarrierSignalStatus.SUCCEEDED })

        const reread = (await listSignals(barrier.id)).find((row) => row.id === signal.id)
        expect(reread.status).toBe(BarrierSignalStatus.SUCCEEDED)
    })

    it('hands a refId outcome to every barrier holding a signal for that refId', async () => {
        const queue = barrierQueue(app.log).get()
        await queue.pause()
        try {
            const refId = apId()
            const first = await createBarrierAwaiting({ refId })
            const second = await createBarrierAwaiting({ refId })
            await drainEvaluations(queue)
            await barrierQueue(app.log).clearEvaluationDedupKey(first.id)
            await barrierQueue(app.log).clearEvaluationDedupKey(second.id)

            const matched = await barrierService(app.log).receiveSignal({ refId, projectId: ctx.project.id, status: BarrierSignalStatus.SUCCEEDED })

            expect(matched).toBe(true)
            for (const barrier of [first, second]) {
                const [signal] = await listSignals(barrier.id)
                expect(signal.status).toBe(BarrierSignalStatus.SUCCEEDED)
                expect(await countPendingEvaluations({ queue, barrierId: barrier.id })).toBe(1)
            }
        }
        finally {
            await drainEvaluations(queue)
            await queue.resume()
        }
    })

    it('refuses a decision once its barrier has closed, so it cannot land after the summary was taken', async () => {
        const queue = barrierQueue(app.log).get()
        await queue.pause()
        try {
            const { flowRun } = await createParentRun()
            const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
            const [signal] = await listSignals(barrier.id)
            await db.update('waitpoint', barrier.id, { status: WaitpointStatus.COMPLETED })

            const recorded = await barrierService(app.log).recordDecision({
                barrierId: barrier.id,
                signalId: signal.id,
                projectId: ctx.project.id,
                status: BarrierSignalStatus.SUCCEEDED,
            })

            expect(recorded).toBe(false)
            const [reread] = await listSignals(barrier.id)
            expect(reread.status).toBe(BarrierSignalStatus.PENDING)
        }
        finally {
            await drainEvaluations(queue)
            await queue.resume()
        }
    })

    async function createBarrierAwaiting({ refId }: { refId: string }): Promise<Waitpoint> {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['child-run'] })
        await databaseConnection().getRepository('waitpoint_signal').update({ waitpointId: barrier.id }, { refId })
        return barrier
    }
})

describe('evaluation coalescing', () => {
    it('clears the deduplication key before evaluating, so a signal landing mid-job is not swallowed', async () => {
        const { flowRun } = await createParentRun()
        const queue = barrierQueue(app.log).get()
        await queue.pause()
        try {
            const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

            await barrierQueue(app.log).enqueueEvaluation({ barrierId: barrier.id, projectId: ctx.project.id })
            const beforeHandling = await countPendingEvaluations({ queue, barrierId: barrier.id })

            await barrierQueue(app.log).clearEvaluationDedupKey(barrier.id)
            await barrierQueue(app.log).enqueueEvaluation({ barrierId: barrier.id, projectId: ctx.project.id })
            const afterHandling = await countPendingEvaluations({ queue, barrierId: barrier.id })

            expect(beforeHandling).toBe(1)
            expect(afterHandling).toBe(2)
        }
        finally {
            await queue.resume()
        }
    })
})

describe('resume guards', () => {
    it('refuses an external resume that addresses a barrier waitpoint', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        const { stale } = await resumeService(app.log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: barrier.id,
            resumePayload: { body: { forged: true } },
        })

        expect(stale).toBe(true)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)
    })

    it('refuses a by-run resume while the run holds a pending barrier', async () => {
        const { flowRun } = await createParentRun()
        await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        const { stale } = await resumeService(app.log).legacyResume({
            flowRunId: flowRun.id,
            resumePayload: { body: { forged: true } },
        })

        expect(stale).toBe(true)
    })

    it('refuses a resume addressed at a waitpoint id the run does not own while a barrier is open', async () => {
        const { flowRun } = await createParentRun()
        await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        const { stale } = await resumeService(app.log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: apId(),
            resumePayload: { body: { forged: true } },
        })

        expect(stale).toBe(true)
    })

    it('lets the module release a barrier and consumes the waitpoint exactly once', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        const [signal] = await listSignals(barrier.id)

        await receiveSignal({ signalId: signal.id, status: BarrierSignalStatus.SUCCEEDED })
        await releaseIfReady(barrier.id)

        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
        expect(await listSignals(barrier.id)).toHaveLength(0)
    })

    it('leaves the resume to the release that closed the barrier, even inside the window before that release consumes it', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await closeWithoutConsuming(barrier.id)
        await dropResumeJobs(flowRun.id)

        const lost = await releaseNow(barrier)

        expect(lost).toBeNull()
        expect(await listResumeJobs(flowRun.id)).toHaveLength(0)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.COMPLETED)
    })

    it('refuses a by-run resume between the barrier closing and the trusted resume consuming it', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await completeWithoutConsuming(barrier.id)

        const { stale } = await resumeService(app.log).legacyResume({
            flowRunId: flowRun.id,
            resumePayload: { body: { forged: true }, headers: {}, queryParams: {} },
        })

        expect(stale).toBe(true)
    })

    it('refuses a by-run resume after the barrier was released while the run is still PAUSED', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })

        await releaseNow(barrier)

        const run = await db.findOneByOrFail<{ status: FlowRunStatus }>('flow_run', { id: flowRun.id })
        expect(run.status).toBe(FlowRunStatus.PAUSED)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)

        const { stale } = await resumeService(app.log).legacyResume({
            flowRunId: flowRun.id,
            resumePayload: { body: { forged: true }, headers: {}, queryParams: {} },
        })

        expect(stale).toBe(true)
    })

    it('refuses a by-run sync resume through both barrier windows', async () => {
        const { flowRun: closedRun } = await createParentRun()
        const { barrier: closedBarrier } = await createBarrier({ flowRunId: closedRun.id, signalLabels: ['a@example.com'] })
        await completeWithoutConsuming(closedBarrier.id)

        const closedResponse = await resumeService(app.log).legacySyncResume({
            runId: closedRun.id,
            payload: { body: { forged: true }, headers: {}, queryParams: {} },
            correlationId: apId(),
        })
        expect(closedResponse.status).toBe(StatusCodes.GONE)

        const { flowRun: releasedRun } = await createParentRun()
        const { barrier: releasedBarrier } = await createBarrier({ flowRunId: releasedRun.id, signalLabels: ['a@example.com'] })
        await releaseNow(releasedBarrier)

        const releasedResponse = await resumeService(app.log).legacySyncResume({
            runId: releasedRun.id,
            payload: { body: { forged: true }, headers: {}, queryParams: {} },
            correlationId: apId(),
        })
        expect(releasedResponse.status).toBe(StatusCodes.GONE)
    })

    it('still resumes a paused run that never held a waitpoint at all', async () => {
        const { flowRun } = await createParentRun()

        const { stale } = await resumeService(app.log).legacyResume({
            flowRunId: flowRun.id,
            resumePayload: { body: { approved: true }, headers: {}, queryParams: {} },
        })

        expect(stale).toBe(false)
    })

    it('leaves a non-barrier waitpoint resumable', async () => {
        const { flowRun } = await createParentRun()
        const { waitpoint } = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            type: PauseType.WEBHOOK,
            version: 'V1',
        })

        const { stale } = await resumeService(app.log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: waitpoint.id,
            resumePayload: { body: { approved: true } },
        })

        expect(stale).toBe(false)
    })

    it('refuses a trusted resume of a barrier that was already delivered', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await releaseNow(barrier)
        await dropResumeJobs(flowRun.id)

        const { stale } = await resumeService(app.log).resumeTrustedWithoutLock({
            flowRunId: flowRun.id,
            waitpointId: barrier.id,
            resumePayload: { body: { forged: true }, headers: {}, queryParams: {} },
        })

        expect(stale).toBe(true)
        expect(await listResumeJobs(flowRun.id)).toHaveLength(0)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
    })

    it('does not dispatch a second resume for a barrier that was already consumed', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await releaseNow(barrier)
        await dropResumeJobs(flowRun.id)

        const { stale } = await resumeService(app.log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: barrier.id,
            resumePayload: { body: { forged: true } },
        })

        expect(stale).toBe(true)
        expect(await listResumeJobs(flowRun.id)).toHaveLength(0)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
    })
})

describe('undelivered resume recovery', () => {
    it('dispatches the resume for a waitpoint that was already completed before the run reached PAUSED', async () => {
        const { flowRun } = await createParentRun()
        const { waitpoint } = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'approval',
            type: PauseType.WEBHOOK,
            version: 'V1',
        })
        await completeWithoutConsuming(waitpoint.id)
        await dropResumeJobs(flowRun.id)

        await recoverUndeliveredResume(flowRun.id)

        expect(await listResumeJobs(flowRun.id)).toHaveLength(1)
        expect(await db.findOneBy('waitpoint', { id: waitpoint.id })).toBeNull()
    })

    it('still resumes when the release that closed the barrier died before dispatching', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await closeWithoutConsuming(barrier.id)
        await dropResumeJobs(flowRun.id)

        await releaseIfReady(barrier.id)

        expect(await listResumeJobs(flowRun.id)).toHaveLength(1)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
    })

    it('fails the evaluation when the re-dispatch fails, so the queue spends its remaining attempts', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await closeWithoutConsuming(barrier.id)
        await dropResumeJobs(flowRun.id)
        await db.update('waitpoint', barrier.id, { flowRunId: apId() })

        await expect(releaseIfReady(barrier.id)).rejects.toThrow()

        expect(await listResumeJobs(flowRun.id)).toHaveLength(0)
        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.COMPLETED)
    })

    it('enqueues nothing when recovery runs a second time on a consumed barrier', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await releaseNow(barrier)
        await dropResumeJobs(flowRun.id)

        await releaseIfReady(barrier.id)

        expect(await recoverUndeliveredResume(flowRun.id)).toBeNull()
        expect(await listResumeJobs(flowRun.id)).toHaveLength(0)
    })
})

describe('signal count limit', () => {
    it('refuses a barrier that waits on more than the platform allows', async () => {
        const { flowRun } = await createParentRun()
        await platformConfigurationService(app.log).update({ platformId: ctx.platform.id, maxBarrierSignals: 2 })

        await expect(createBarrier({ flowRunId: flowRun.id, signalLabels: ['a', 'b', 'c'] })).rejects.toMatchObject({
            error: {
                code: ErrorCode.VALIDATION,
                params: { message: expect.stringContaining('exceeds the maximum of 2') },
            },
        })
    })

    it('allows a barrier at exactly the platform limit', async () => {
        const { flowRun } = await createParentRun()
        await platformConfigurationService(app.log).update({ platformId: ctx.platform.id, maxBarrierSignals: 2 })

        const { signalCount } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a', 'b'] })

        expect(signalCount).toBe(2)
    })
})

describe('barrier deadline', () => {
    beforeAll(async () => {
        await systemJobsQueue.removeJobScheduler(SystemJobName.WAITPOINT_DEADLINE_SWEEP)
    })

    beforeEach(async () => {
        await distributedStore.delete([DEADLINE_SWEEP_CURSOR_KEY, BARRIER_RECOVERY_CURSOR_KEY])
        await databaseConnection().query('DELETE FROM "waitpoint"')
    })

    async function createUndeliveredBarrier({ staleByMinutes }: { staleByMinutes: number }) {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await closeWithoutConsuming(barrier.id)
        await db.update('waitpoint', barrier.id, { updated: dayjs().subtract(staleByMinutes, 'minute').toISOString() })
        await dropResumeJobs(flowRun.id)
        return { flowRun, barrier }
    }

    async function createOverdueBarrier({ overdueByMinutes = 5 }: { overdueByMinutes?: number } = {}) {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })
        await db.update('waitpoint', barrier.id, { resumeDateTime: dayjs().subtract(overdueByMinutes, 'minute').toISOString() })
        return { flowRun, barrier }
    }

    async function dropDeadlineJob(waitpointId: string): Promise<void> {
        await systemJobsSchedule(app.log).removeJob({ jobId: systemJobIds.resumeDelay({ waitpointId }) })
    }

    async function exhaustDeadlineJobAttempts(waitpointId: string): Promise<void> {
        const redis = await redisConnections.useExisting()
        const jobId = systemJobIds.resumeDelay({ waitpointId })
        await redis.zrem('bull:system-job-queue:delayed', jobId)
        await redis.zadd('bull:system-job-queue:failed', Date.now(), jobId)
    }

    async function readDeadLetteredAt(waitpointId: string): Promise<string | null> {
        const waitpoint = await db.findOneByOrFail<{ deadLetteredAt: string | null }>('waitpoint', { id: waitpointId })
        return waitpoint.deadLetteredAt
    }

    it('carries a deadline from creation, so a barrier nobody signals is still swept and released', async () => {
        const { flowRun, barrier } = await createOverdueBarrier()
        expect(barrier.resumeDateTime).not.toBeNull()
        await dropDeadlineJob(barrier.id)

        const armed = await sweepOverdueDeadlines({ log: app.log })
        expect(armed).toContain(barrier.id)

        await waitFor(async () => await readStatus(barrier.id) === WaitpointStatus.CONSUMED)

        expect(await listSignals(barrier.id)).toHaveLength(0)
        expect(await listResumeJobs(flowRun.id)).not.toHaveLength(0)
    })

    it('hands a barrier it finds closed but never delivered back to the barrier queue, which then delivers it', async () => {
        const queue = barrierQueue(app.log).get()
        await queue.pause()

        try {
            const { flowRun, barrier } = await createUndeliveredBarrier({ staleByMinutes: 10 })
            await drainEvaluations(queue)

            await sweepOverdueDeadlines({ log: app.log })

            expect(await countPendingEvaluations({ queue, barrierId: barrier.id })).toBe(1)

            await barrierService(app.log).releaseIfReady({ barrierId: barrier.id, projectId: ctx.project.id })

            expect(await listResumeJobs(flowRun.id)).toHaveLength(1)
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
        }
        finally {
            await drainEvaluations(queue)
            await queue.resume()
        }
    })

    it('leaves a barrier closed moments ago to the release that closed it', async () => {
        const queue = barrierQueue(app.log).get()
        await queue.pause()

        try {
            const { flowRun } = await createParentRun()
            const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
            await closeWithoutConsuming(barrier.id)
            await dropResumeJobs(flowRun.id)
            await drainEvaluations(queue)

            await sweepOverdueDeadlines({ log: app.log })

            expect(await countPendingEvaluations({ queue, barrierId: barrier.id })).toBe(0)
            expect(await listResumeJobs(flowRun.id)).toHaveLength(0)
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.COMPLETED)
        }
        finally {
            await drainEvaluations(queue)
            await queue.resume()
        }
    })

    it('carries its cursor past barriers it could not hand back, so a newer one is still recovered', async () => {
        const queue = barrierQueue(app.log).get()
        await queue.pause()
        const { barrier: poisoned } = await createUndeliveredBarrier({ staleByMinutes: 20 })
        const { barrier: healthy } = await createUndeliveredBarrier({ staleByMinutes: 10 })
        await drainEvaluations(queue)

        const realBarrierQueue = barrierQueueModule.barrierQueue
        vi.spyOn(barrierQueueModule, 'barrierQueue').mockImplementation((log) => ({
            ...realBarrierQueue(log),
            enqueueEvaluation: async (params) => {
                if (params.barrierId === poisoned.id) {
                    throw new Error('enqueue failed')
                }
                return realBarrierQueue(log).enqueueEvaluation(params)
            },
        }))

        try {
            await sweepOverdueDeadlines({ log: app.log, maxRedelivered: 1 })

            expect(await countPendingEvaluations({ queue, barrierId: poisoned.id })).toBe(0)
            expect(await countPendingEvaluations({ queue, barrierId: healthy.id })).toBe(0)

            await sweepOverdueDeadlines({ log: app.log, maxRedelivered: 1 })

            expect(await countPendingEvaluations({ queue, barrierId: healthy.id })).toBe(1)
        }
        finally {
            vi.restoreAllMocks()
            await drainEvaluations(queue)
            await queue.resume()
        }
    })

    it('carries on through the batch when one undelivered barrier cannot be handed back', async () => {
        const queue = barrierQueue(app.log).get()
        await queue.pause()
        const { barrier: broken } = await createUndeliveredBarrier({ staleByMinutes: 20 })
        const { barrier: healthy } = await createUndeliveredBarrier({ staleByMinutes: 10 })
        await drainEvaluations(queue)

        const realBarrierQueue = barrierQueueModule.barrierQueue
        vi.spyOn(barrierQueueModule, 'barrierQueue').mockImplementation((log) => ({
            ...realBarrierQueue(log),
            enqueueEvaluation: async (params) => {
                if (params.barrierId === broken.id) {
                    throw new Error('enqueue failed')
                }
                return realBarrierQueue(log).enqueueEvaluation(params)
            },
        }))
        const sweepFields = vi.spyOn(wideEvent, 'set')

        try {
            await sweepOverdueDeadlines({ log: app.log })

            expect(await countPendingEvaluations({ queue, barrierId: broken.id })).toBe(0)
            expect(await countPendingEvaluations({ queue, barrierId: healthy.id })).toBe(1)
            expect(await readStatus(broken.id)).toBe(WaitpointStatus.COMPLETED)
            expect(await readStatus(healthy.id)).toBe(WaitpointStatus.COMPLETED)
            expect(sweepFields).toHaveBeenCalledWith(expect.objectContaining({
                waitpointSweep: expect.objectContaining({
                    barriersEnqueuedCount: 1,
                    barriersEnqueueFailedCount: 1,
                }),
            }))
        }
        finally {
            vi.restoreAllMocks()
            await drainEvaluations(queue)
            await queue.resume()
        }
    })

    it('does not report a barrier whose deadline job is still live as re-armed', async () => {
        const { barrier } = await createOverdueBarrier()

        const armed = await sweepOverdueDeadlines({ log: app.log })

        expect(armed).not.toContain(barrier.id)
    })

    it('re-arms the oldest overdue deadlines first', async () => {
        const oldest = await createOverdueBarrier({ overdueByMinutes: 30 })
        const middle = await createOverdueBarrier({ overdueByMinutes: 20 })
        const newest = await createOverdueBarrier({ overdueByMinutes: 10 })
        for (const { barrier } of [oldest, middle, newest]) {
            await dropDeadlineJob(barrier.id)
        }

        const armed = await sweepOverdueDeadlines({ log: app.log })

        expect(armed).toEqual([oldest.barrier.id, middle.barrier.id, newest.barrier.id])
    })

    it('marks a deadline whose job exhausted its attempts, so the sweep stops reading it every tick', async () => {
        const { barrier } = await createOverdueBarrier()
        await exhaustDeadlineJobAttempts(barrier.id)

        const armed = await sweepOverdueDeadlines({ log: app.log })

        expect(armed).not.toContain(barrier.id)
        expect(await readDeadLetteredAt(barrier.id)).not.toBeNull()
    })

    it('re-arms a newer deadline even when older dead-lettered ones would fill the scan ahead of it', async () => {
        const stuck = await createOverdueBarrier({ overdueByMinutes: 30 })
        const newer = await createOverdueBarrier({ overdueByMinutes: 10 })
        await dropDeadlineJob(stuck.barrier.id)
        await dropDeadlineJob(newer.barrier.id)
        await db.update('waitpoint', stuck.barrier.id, { deadLetteredAt: dayjs().toISOString() })

        const armed = await sweepOverdueDeadlines({ log: app.log })

        expect(armed).toEqual([newer.barrier.id])
    })

    it('pages past deadlines that are already armed to reach a newer unarmed one', async () => {
        const alreadyArmed = await createOverdueBarrier({ overdueByMinutes: 30 })
        const newer = await createOverdueBarrier({ overdueByMinutes: 10 })
        await dropDeadlineJob(newer.barrier.id)

        const armed = await sweepOverdueDeadlines({ log: app.log, pageSize: 1 })

        expect(armed).toEqual([newer.barrier.id])
        expect(await readDeadLetteredAt(alreadyArmed.barrier.id)).toBeNull()
    })

    it('carries its cursor to the next tick, so an armed prefix cannot starve a newer deadline', async () => {
        for (const overdueByMinutes of [40, 30, 20]) {
            await createOverdueBarrier({ overdueByMinutes })
        }
        const newest = await createOverdueBarrier({ overdueByMinutes: 10 })
        await dropDeadlineJob(newest.barrier.id)

        const firstTick = await sweepOverdueDeadlines({ log: app.log, pageSize: 1, maxPages: 2 })
        const secondTick = await sweepOverdueDeadlines({ log: app.log, pageSize: 1, maxPages: 2 })

        expect(firstTick).toEqual([])
        expect(secondTick).toEqual([newest.barrier.id])
    })

    it('starts over from the oldest once a tick reaches the end of the backlog', async () => {
        const oldest = await createOverdueBarrier({ overdueByMinutes: 40 })
        await dropDeadlineJob(oldest.barrier.id)

        await sweepOverdueDeadlines({ log: app.log })

        expect(await distributedStore.get(DEADLINE_SWEEP_CURSOR_KEY)).toBeNull()
    })

    it('leaves a deadline unmarked when it was re-armed after the scan began', async () => {
        const { barrier } = await createOverdueBarrier()
        await exhaustDeadlineJobAttempts(barrier.id)
        await db.update('waitpoint', barrier.id, { updated: dayjs().add(1, 'minute').toISOString() })

        const armed = await sweepOverdueDeadlines({ log: app.log })

        expect(armed).not.toContain(barrier.id)
        expect(await readDeadLetteredAt(barrier.id)).toBeNull()
    })

    it('clears the mark when a fresh pause re-arms the same deadline', async () => {
        const { flowRun } = await createParentRun()
        const resumeDateTime = dayjs().add(1, 'hour').toISOString()
        const { waitpoint } = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'delay',
            type: PauseType.DELAY,
            version: 'V1',
            resumeDateTime,
        })
        await db.update('waitpoint', waitpoint.id, { deadLetteredAt: dayjs().toISOString() })

        const { waitpoint: reArmed } = await waitpointService(app.log).createForPause({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            stepName: 'delay',
            type: PauseType.DELAY,
            version: 'V1',
            resumeDateTime,
        })

        expect(reArmed.deadLetteredAt).toBeNull()
        expect(await readDeadLetteredAt(waitpoint.id)).toBeNull()
    })

    it('releases a barrier whose deadline lands past the run-age window instead of failing the run', async () => {
        const { flowRun, barrier } = await createOverdueBarrier()
        await db.update('flow_run', flowRun.id, { created: dayjs().subtract(PAUSE_TIMEOUT_DAYS + 1, 'day').toISOString() })
        await dropDeadlineJob(barrier.id)

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
        expect(await readSummary(barrier.id)).toMatchObject({ timedOut: true, stillRunning: 2 })
    })

    it('anchors the barrier deadline to the run start, not to the moment the barrier opened', async () => {
        const { flowRun } = await createParentRun()
        const runCreated = dayjs().subtract(10, 'day').toISOString()
        await db.update('flow_run', flowRun.id, { created: runCreated })

        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })

        expect(dayjs(barrier.resumeDateTime).toISOString()).toBe(dayjs(runCreated).add(PAUSE_TIMEOUT_DAYS, 'day').toISOString())
    })

    it('re-arms a deadline that fell behind the run-age window instead of leaving its run paused for good', async () => {
        const { barrier } = await createOverdueBarrier({ overdueByMinutes: (PAUSE_TIMEOUT_DAYS + 5) * 24 * 60 })
        await dropDeadlineJob(barrier.id)

        const armed = await sweepOverdueDeadlines({ log: app.log })

        expect(armed).toContain(barrier.id)
    })

    it('counts the signals nobody answered as still running and marks the release as timed out', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        await barrierService(app.log).release({ barrier, timedOut: true, releaseReason: 'timeout' })

        const summary = await readSummary(barrier.id)
        expect(summary.timedOut).toBe(true)
        expect(summary.stillRunning).toBe(2)
    })

    it('leaves a deadline job that is running right now to finish, without a warning', async () => {
        const { flowRun, barrier } = await createOverdueBarrier()
        const jobId = systemJobIds.resumeDelay({ waitpointId: barrier.id })
        const lockKey = `bull:system-job-queue:${jobId}:lock`
        const redis = await redisConnections.useExisting()
        await redis.set(lockKey, 'held-by-the-worker-running-this-job')
        const warn = vi.spyOn(app.log, 'warn')

        try {
            await waitpointTimeoutJob.remove({ waitpointId: barrier.id, flowRunId: flowRun.id, log: app.log })

            expect(warn).not.toHaveBeenCalled()
            expect(await systemJobsSchedule(app.log).getJob(jobId)).toBeDefined()
        }
        finally {
            vi.restoreAllMocks()
            await redis.del(lockKey)
        }
    })
})

describe('multi-approval confirm page', () => {
    async function createApprovalBarrier({ reasonRequiredOn, requiredSuccesses, runStatus }: { reasonRequiredOn?: 'none' | 'reject' | 'both', requiredSuccesses?: number, runStatus?: FlowRunStatus } = {}) {
        const { flowRun } = await createParentRun(runStatus ?? FlowRunStatus.PAUSED)
        const created = await barrierService(app.log).create({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            stepName: 'approval',
            version: 'V1',
            policy: { requiredSuccesses: requiredSuccesses ?? 2, ...(reasonRequiredOn ? { reasonRequiredOn } : {}) },
            signalLabels: ['a@example.com', 'b@example.com', 'c@example.com'],
        })
        return { flowRun, created, signals: await listSignals(created.barrier.id) }
    }

    it('records each approver\'s decision and reason on their own signal', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier({ requiredSuccesses: 3 })

        for (const signal of signals.slice(0, 2)) {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/flow-runs/${flowRun.id}/signals/${signal.id}/confirm?action=approve`,
                payload: { reason: `looks good from ${signal.label}` },
            })
            expect(response.statusCode).toBe(200)
        }

        const decided = (await listSignals(created.barrier.id)).filter((signal) => signal.status === BarrierSignalStatus.SUCCEEDED)
        expect(decided).toHaveLength(2)
        expect(decided.map((signal) => signal.result.reason).sort()).toEqual(['looks good from a@example.com', 'looks good from b@example.com'])
    })

    it('releases once the required approvals have landed, leaving the third link closed', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier()

        for (const signal of signals.slice(0, 2)) {
            await app.inject({
                method: 'POST',
                url: `/api/v1/flow-runs/${flowRun.id}/signals/${signal.id}/confirm?action=approve`,
                payload: { reason: 'ok' },
            })
        }

        await waitFor(async () => await readStatus(created.barrier.id) === WaitpointStatus.CONSUMED)
        expect(await listSignals(created.barrier.id)).toHaveLength(0)
    })

    it('records a decision that lands before the run has flipped to PAUSED', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier({ runStatus: FlowRunStatus.RUNNING })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=approve`,
            payload: { reason: 'approving from the email before the engine paused' },
        })

        expect(response.statusCode).toBe(200)
        const stored = (await listSignals(created.barrier.id)).find((signal) => signal.id === signals[0].id)
        expect(stored?.status).toBe(BarrierSignalStatus.SUCCEEDED)
    })

    it('keeps the first decision when the same link is posted twice', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier({ requiredSuccesses: 3 })

        const approve = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=approve`,
            payload: { reason: 'yes' },
        })
        const flip = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=disapprove`,
            payload: { reason: 'changed my mind' },
        })

        expect(approve.statusCode).toBe(200)
        expect(flip.statusCode).toBe(200)
        const stored = (await listSignals(created.barrier.id)).find((signal) => signal.id === signals[0].id)
        expect(stored?.status).toBe(BarrierSignalStatus.SUCCEEDED)
        expect(stored?.result.reason).toBe('yes')
    })

    it('does not resurrect a signal the release already deleted', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier()

        for (const signal of signals.slice(0, 2)) {
            await app.inject({
                method: 'POST',
                url: `/api/v1/flow-runs/${flowRun.id}/signals/${signal.id}/confirm?action=approve`,
                payload: { reason: 'ok' },
            })
        }
        await waitFor(async () => await readStatus(created.barrier.id) === WaitpointStatus.CONSUMED)

        const late = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[2].id}/confirm?action=approve`,
            payload: { reason: 'late to the party' },
        })

        expect(late.statusCode).toBe(200)
        expect(await listSignals(created.barrier.id)).toHaveLength(0)
    })

    it('records a disapprove with no reason when the policy never asked for one', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=disapprove`,
            payload: {},
        })

        expect(response.statusCode).toBe(200)
        const stored = (await listSignals(created.barrier.id)).find((signal) => signal.id === signals[0].id)
        expect(stored?.status).toBe(BarrierSignalStatus.REJECTED)
    })

    it('rejects a reject with no reason when reasonRequiredOn is reject', async () => {
        const { flowRun, signals } = await createApprovalBarrier({ reasonRequiredOn: 'reject' })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=disapprove`,
            payload: {},
        })

        expect(response.statusCode).toBe(400)
        expect((await listSignals(signals[0].waitpointId))[0].status).toBe(BarrierSignalStatus.PENDING)
    })

    it('rejects an over-long reason rather than truncating it', async () => {
        const { flowRun, signals } = await createApprovalBarrier()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=approve`,
            payload: { reason: 'x'.repeat(MAX_SIGNAL_REASON_LENGTH + 1) },
        })

        expect(response.statusCode).toBe(400)
    })

    it('counts a line break in a form-posted reason once, the way the textarea limit does', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier()
        const lines = ['line one', 'line two', 'line three']
        const lastLine = 'x'.repeat(MAX_SIGNAL_REASON_LENGTH - lines.join('\n').length - 1)
        const typedReason = [...lines, lastLine].join('\n')

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=approve`,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: `reason=${encodeURIComponent(typedReason.replace(/\n/g, '\r\n'))}`,
        })

        expect(typedReason).toHaveLength(MAX_SIGNAL_REASON_LENGTH)
        expect(response.statusCode).toBe(200)
        const stored = (await listSignals(created.barrier.id)).find((signal) => signal.id === signals[0].id)
        expect(stored?.result).toMatchObject({ reason: typedReason })
    })

    it('stores a reason carrying a NUL byte sanitised rather than failing the write', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=approve`,
            payload: { reason: `fine ${String.fromCharCode(0)} by me` },
        })

        expect(response.statusCode).toBe(200)
        const stored = (await listSignals(created.barrier.id)).find((signal) => signal.id === signals[0].id)
        expect(stored?.status).toBe(BarrierSignalStatus.SUCCEEDED)
        expect(JSON.stringify(stored?.result)).not.toContain('\\u0000')
    })

    it('tells the third approver the request is already closed once the barrier released', async () => {
        const { flowRun, created, signals } = await createApprovalBarrier()

        for (const signal of signals.slice(0, 2)) {
            await app.inject({
                method: 'POST',
                url: `/api/v1/flow-runs/${flowRun.id}/signals/${signal.id}/confirm?action=approve`,
                payload: { reason: 'ok' },
            })
        }
        await waitFor(async () => await readStatus(created.barrier.id) === WaitpointStatus.CONSUMED)

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[2].id}/confirm`,
            headers: { accept: 'text/html' },
        })

        expect(response.statusCode).toBe(200)
        expect(response.body).toContain('Already responded')
    })

    it('records nothing when the confirm url is posted with no action at all', async () => {
        const { flowRun, signals } = await createApprovalBarrier()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm`,
            payload: { reason: 'posted the bare link' },
        })

        expect(response.statusCode).toBe(400)
        expect((await listSignals(signals[0].waitpointId))[0].status).toBe(BarrierSignalStatus.PENDING)
    })

    it('records nothing when the action is misspelled rather than treating it as an approval', async () => {
        const { flowRun, signals } = await createApprovalBarrier()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${flowRun.id}/signals/${signals[0].id}/confirm?action=aprove`,
            payload: { reason: 'typo' },
        })

        expect(response.statusCode).toBe(400)
        expect((await listSignals(signals[0].waitpointId))[0].status).toBe(BarrierSignalStatus.PENDING)
    })

    it('refuses a signal id that belongs to another run', async () => {
        const { signals } = await createApprovalBarrier()
        const { flowRun: otherRun } = await createParentRun()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/flow-runs/${otherRun.id}/signals/${signals[0].id}/confirm?action=approve`,
            payload: { reason: 'not mine' },
        })

        expect(response.statusCode).toBe(200)
        expect((await listSignals(signals[0].waitpointId))[0].status).toBe(BarrierSignalStatus.PENDING)
    })
})

describe('fan-out dispatch', () => {
    it('creates exactly one child per signal even when two dispatchers run concurrently', async () => {
        const { flowRun } = await createFanOutParentRun()
        const { barrier, signalCount } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4, 5, 6], batchSize: 2 })
        expect(signalCount).toBe(3)

        await Promise.all([dispatch(barrier.id), dispatch(barrier.id)])
        await waitFor(async () => (await listChildren(barrier.id)).length >= 3)
        await dispatch(barrier.id)

        const children = await listChildren(barrier.id)
        expect(children).toHaveLength(3)
        expect(children.map((child) => child.dispatchIndex).sort()).toEqual([0, 1, 2])
    })

    it('seeds each child under the batch step name, so a batch inside a loop still reads its items', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3], batchSize: 2, stepName: 'loop_1:3/batch_1', batchStepName: 'batch_1' })

            const payloads = await dispatchReadingChildPayloads(barrier.id)

            expect(payloads).toHaveLength(2)
            expect(payloads).toEqual(expect.arrayContaining([
                { type: 'inline', value: { batch_1: expect.objectContaining({ status: 'SUCCEEDED', output: { items: [1, 2] } }) } },
                { type: 'inline', value: { batch_1: expect.objectContaining({ status: 'SUCCEEDED', output: { items: [3] } }) } },
            ]))
        })
    })

    it('stops without dispatching when the barrier was cancelled, and its signals are gone by cascade', async () => {
        const { flowRun } = await createFanOutParentRun()
        const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })

        await waitpointService(app.log).deleteByFlowRunId({ flowRunId: flowRun.id, projectId: ctx.project.id })
        expect(await listSignals(barrier.id)).toHaveLength(0)
        const beforeCancel = (await listChildren(barrier.id)).length

        await expect(dispatch(barrier.id)).resolves.toBeUndefined()

        expect(await listChildren(barrier.id)).toHaveLength(beforeCancel)
    })

    it('deletes the stored source when a failed run discards its barrier, so a dispatch after it stops', async () => {
        const { flowRun } = await createFanOutParentRun()
        const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
        expect(await distributedStore.exists(barrierSourceKey(barrier.id))).toBe(true)

        await waitpointService(app.log).deleteForFinishedRun({
            flowRun: { ...flowRun, status: FlowRunStatus.FAILED, failedStep: { name: 'other_step', displayName: 'Other step', message: 'boom' } },
        })

        expect(await distributedStore.exists(barrierSourceKey(barrier.id))).toBe(false)
        const beforeDispatch = (await listChildren(barrier.id)).length
        await expect(dispatch(barrier.id)).resolves.toBeUndefined()
        expect(await listChildren(barrier.id)).toHaveLength(beforeDispatch)
    })

    it('claims nothing once the barrier has released, so a timeout mid-dispatch adds no children', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            await barrierService(app.log).release({ barrier, timedOut: true, releaseReason: 'timeout' })
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.COMPLETED)

            expect(await claimChunk({ barrierId: barrier.id, flowRunId: flowRun.id, limit: 25 })).toBeNull()
            await expect(dispatch(barrier.id)).resolves.toBeUndefined()

            expect(await listChildren(barrier.id)).toHaveLength(0)
        })
    })

    it('lists every child claimed before a release in that release summary', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            const chunk = await claimChunk({ barrierId: barrier.id, flowRunId: flowRun.id, limit: 2 })
            assertNotNullOrUndefined(chunk, 'chunk')

            await barrierService(app.log).release({ barrier, timedOut: true, releaseReason: 'timeout' })

            const summary = await readSummary(barrier.id)
            expect(summary.stillRunning).toBe(4)
            const attributedRunIds = (summary.signals ?? []).map((signal) => signal.runId).filter((runId) => !isNil(runId))
            expect(attributedRunIds.sort()).toEqual(chunk.childRuns.map((childRun) => childRun.id).sort())
            await dispatch(barrier.id)
            expect(await listChildren(barrier.id)).toHaveLength(2)
        })
    })

    it('cancels a claimed child whose barrier released before its enqueue, so it never starts', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1], batchSize: 1 })
            const realBarrierService = barrierServiceModule.barrierService
            vi.spyOn(barrierServiceModule, 'barrierService').mockImplementation((log) => ({
                ...realBarrierService(log),
                lockForDispatch: async (params) => {
                    await realBarrierService(log).release({ barrier, timedOut: true, releaseReason: 'timeout' })
                    return realBarrierService(log).lockForDispatch(params)
                },
            }))
            try {
                await expect(dispatch(barrier.id)).resolves.toBeUndefined()
            }
            finally {
                vi.restoreAllMocks()
            }

            expect(await readSummary(barrier.id)).toMatchObject({ total: 1, stillRunning: 1 })
            await waitFor(async () => (await listChildren(barrier.id))[0]?.status === FlowRunStatus.CANCELED)
        })
    })

    it('claims nothing for a barrier that no longer resolves', async () => {
        const { flowRun } = await createFanOutParentRun()

        expect(await claimChunk({ barrierId: apId(), flowRunId: flowRun.id, limit: 25 })).toBeNull()
    })

    it('refuses to resolve a dispatch target for a parent run outside the project', async () => {
        await expect(childRunDispatchService(app.log).prepareChildDispatch({
            projectId: ctx.project.id,
            parentRunId: apId(),
            entryStepName: FAN_OUT_ENTRY_STEP,
        })).rejects.toThrow(ErrorCode.VALIDATION)
    })

    it('refuses to resolve a dispatch target for a step the flow version does not have', async () => {
        const { flowRun } = await createFanOutParentRun()

        await expect(childRunDispatchService(app.log).prepareChildDispatch({
            projectId: ctx.project.id,
            parentRunId: flowRun.id,
            entryStepName: 'step_does_not_exist',
        })).rejects.toThrow(ErrorCode.VALIDATION)
    })

    it('refuses to start a child run at the trigger, because the engine enters a run only at an action', async () => {
        const { flowRun } = await createFanOutParentRun()

        await expect(childRunDispatchService(app.log).prepareChildDispatch({
            projectId: ctx.project.id,
            parentRunId: flowRun.id,
            entryStepName: 'trigger',
        })).rejects.toThrow(ErrorCode.VALIDATION)
    })

    it('marks the rest undispatched when dispatch exhausts its attempts, so the barrier releases now', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })

            await giveUp(barrier.id)
            await releaseIfReady(barrier.id)

            const summary = await readSummary(barrier.id)
            expect(summary.notDispatched).toBe(4)
            expect(summary.total).toBe(4)
        })
    })

    it('queues the give-up as its own retried job once dispatch fails for good, and not mid-ladder', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const queue = barrierQueue(app.log).get()
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2], batchSize: 1 })

            await failDispatch({ barrierId: barrier.id, attemptsMade: 4 })
            expect(await queue.getJob(`give-up-${barrier.id}`)).toBeUndefined()

            await failDispatch({ barrierId: barrier.id, attemptsMade: 5 })
            const giveUpJob = await queue.getJob(`give-up-${barrier.id}`)
            expect(giveUpJob?.name).toBe(BarrierJobName.FAN_OUT_GIVE_UP)
            expect(giveUpJob?.opts.attempts).toBe(5)
            expect((await listSignals(barrier.id)).map((signal) => signal.status)).toEqual([BarrierSignalStatus.PENDING, BarrierSignalStatus.PENDING])
        })
    })

    it('fails the give-up when settling the signals fails, so the queue retries it instead of leaving the parent waiting', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2], batchSize: 1 })
            const realBarrierService = barrierServiceModule.barrierService
            vi.spyOn(barrierServiceModule, 'barrierService').mockImplementation((log) => ({
                ...realBarrierService(log),
                markUnclaimedNotDispatched: async () => {
                    throw new Error('postgres is down')
                },
            }))
            try {
                await expect(giveUp(barrier.id)).rejects.toThrow('postgres is down')
            }
            finally {
                vi.restoreAllMocks()
            }

            await giveUp(barrier.id)
            await releaseIfReady(barrier.id)

            expect(await readSummary(barrier.id)).toMatchObject({ total: 2, notDispatched: 2, stillRunning: 0 })
        })
    })

    it('settles the unclaimed signals when the barrier worker runs a queued give-up', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        const barrier = await withBarrierQueuePaused(async () => {
            const created = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2], batchSize: 1 })
            await barrierQueue(app.log).get().remove(`dispatch-${created.barrier.id}`)
            return created.barrier
        })

        await barrierQueue(app.log).addFanOutGiveUp({ barrierId: barrier.id, projectId: ctx.project.id })
        await waitFor(async () => (await readStatus(barrier.id)) !== WaitpointStatus.PENDING)

        expect(await readSummary(barrier.id)).toMatchObject({ total: 2, notDispatched: 2, stillRunning: 0 })
        expect(await distributedStore.exists(barrierSourceKey(barrier.id))).toBe(false)
    })

    it('spares the signals whose children are already live when dispatch gives up', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            const chunk = await claimChunk({ barrierId: barrier.id, flowRunId: flowRun.id, limit: 2 })
            assertNotNullOrUndefined(chunk, 'chunk')
            const claimedRefIds = chunk.claims.map((claim) => claim.childRunId)

            await giveUp(barrier.id)
            await releaseIfReady(barrier.id)

            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)
            const afterGiveUp = await listSignals(barrier.id)
            expect(afterGiveUp.filter((signal) => signal.status === BarrierSignalStatus.PENDING).map((signal) => signal.refId).sort()).toEqual([...claimedRefIds].sort())
            expect(afterGiveUp.filter((signal) => signal.status === BarrierSignalStatus.NOT_DISPATCHED)).toHaveLength(2)
            expect(await barrierService(app.log).hasUnclaimedSignals({ barrierId: barrier.id, projectId: ctx.project.id })).toBe(false)

            await receiveSignal({ signalId: chunk.claims[0].signalId, status: BarrierSignalStatus.SUCCEEDED })
            await releaseIfReady(barrier.id)
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)

            await receiveSignal({ signalId: chunk.claims[1].signalId, status: BarrierSignalStatus.SUCCEEDED })
            await releaseIfReady(barrier.id)

            expect(await readSummary(barrier.id)).toMatchObject({ total: 4, succeeded: 2, notDispatched: 2, stillRunning: 0 })
        })
    })

    it('settles a claim that a dispatcher releases after dispatch gave up, so the barrier does not wait for its deadline', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            failNextChildEnqueue({ beforeFailure: () => giveUp(barrier.id) })
            try {
                await expect(dispatch(barrier.id)).rejects.toThrow('redis is down')
            }
            finally {
                vi.restoreAllMocks()
            }

            const signals = await listSignals(barrier.id)
            expect(signals.filter((signal) => signal.status === BarrierSignalStatus.NOT_DISPATCHED)).toHaveLength(1)
            const live = signals.filter((signal) => signal.status === BarrierSignalStatus.PENDING)
            expect(live).toHaveLength(3)
            expect(await listChildren(barrier.id)).toHaveLength(3)

            await Promise.all(live.map((signal) => receiveSignal({ signalId: signal.id, status: BarrierSignalStatus.SUCCEEDED })))
            await releaseIfReady(barrier.id)

            expect(await readSummary(barrier.id)).toMatchObject({ total: 4, succeeded: 3, notDispatched: 1, stillRunning: 0 })
        })
    })

    it('leaves a claim that failed to enqueue for the next attempt while dispatch has not given up', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            failNextChildEnqueue({})
            try {
                await expect(dispatch(barrier.id)).rejects.toThrow('redis is down')
            }
            finally {
                vi.restoreAllMocks()
            }
            expect(await listChildren(barrier.id)).toHaveLength(3)
            expect(await barrierService(app.log).hasUnclaimedSignals({ barrierId: barrier.id, projectId: ctx.project.id })).toBe(true)

            await dispatch(barrier.id)

            const children = await listChildren(barrier.id)
            expect(children.map((child) => child.dispatchIndex).sort()).toEqual([0, 1, 2, 3])
        })
    })

    it('dispatches nothing and settles the barrier when the platform has no run credits', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            vi.spyOn(billingProviderModule, 'shouldBlockRunOnCredits').mockResolvedValue(true)
            try {
                await dispatch(barrier.id)
            }
            finally {
                vi.restoreAllMocks()
            }

            expect(await listChildren(barrier.id)).toHaveLength(0)
            await releaseIfReady(barrier.id)
            expect(await readSummary(barrier.id)).toMatchObject({ total: 4, notDispatched: 4 })
        })
    })

    it('starts the dispatch again when the engine retries a fan-out create that failed after its commit', async () => {
        const { flowRun } = await createFanOutParentRun()
        await withBarrierQueuePaused(async () => {
            const queue = barrierQueue(app.log).get()
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            await queue.remove(`dispatch-${barrier.id}`)
            await distributedStore.delete(barrierSourceKey(barrier.id))

            const retried = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })

            expect(retried.barrier.id).toBe(barrier.id)
            expect(await distributedStore.exists(barrierSourceKey(barrier.id))).toBe(true)
            expect(await queue.getJob(`dispatch-${barrier.id}`)).toBeDefined()
        })
    })

    it('keeps a released fan-out barrier when the engine retries its create, so no batch runs twice', async () => {
        const { flowRun } = await createFanOutParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const queue = barrierQueue(app.log).get()
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3], batchSize: 1 })
            await queue.remove(`dispatch-${barrier.id}`)
            await dispatch(barrier.id)
            const children = await listChildren(barrier.id)
            for (const child of children) {
                await barrierService(app.log).receiveSignal({ refId: child.id, projectId: ctx.project.id, status: BarrierSignalStatus.SUCCEEDED })
            }
            await releaseIfReady(barrier.id)
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.COMPLETED)

            const retried = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3], batchSize: 1 })
            await dispatch(retried.barrier.id)

            expect(retried.barrier.id).toBe(barrier.id)
            expect(await databaseConnection().getRepository('flow_run').findBy({ parentRunId: flowRun.id })).toHaveLength(3)
            expect(await queue.getJob(`dispatch-${barrier.id}`)).toBeUndefined()
            expect(await distributedStore.exists(barrierSourceKey(barrier.id))).toBe(false)

            await db.update('flow_run', flowRun.id, { status: FlowRunStatus.PAUSED })
            await dropResumeJobs(flowRun.id)
            await recoverUndeliveredResume(flowRun.id)

            expect(await listResumeJobs(flowRun.id)).toHaveLength(1)
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
        })
    })

    it('keeps an open fan-out barrier when the engine retries its create, so its children are not dispatched again', async () => {
        const { flowRun } = await createFanOutParentRun()
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3], batchSize: 1 })
            await dispatch(barrier.id)

            const retried = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3], batchSize: 1 })
            await dispatch(retried.barrier.id)

            expect(retried.barrier.id).toBe(barrier.id)
            expect(await listChildren(barrier.id)).toHaveLength(3)
        })
    })

    it('replaces a consumed barrier when its step creates one again', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })
        await closeWithoutConsuming(barrier.id)
        const closed = await barrierService(app.log).findById({ barrierId: barrier.id, projectId: ctx.project.id })
        assertNotNullOrUndefined(closed, 'closed barrier')
        await waitpointService(app.log).consume({ waitpoint: closed })

        const recreated = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com'] })

        expect(recreated.barrier.id).not.toBe(barrier.id)
        expect(await readStatus(recreated.barrier.id)).toBe(WaitpointStatus.PENDING)
        expect(await listSignals(recreated.barrier.id)).toEqual([expect.objectContaining({ status: BarrierSignalStatus.PENDING })])
        expect(await db.findOneBy('waitpoint', { id: barrier.id })).toBeNull()
    })

    it('gives up on an unrecoverable failure and on the last attempt, but not mid-ladder', async () => {
        expect(fanOutDispatchGaveUp({ attemptsMade: 1, attempts: 5, error: new Error('boom') })).toBeNull()
        expect(fanOutDispatchGaveUp({ attemptsMade: 4, attempts: 5, error: new Error('boom') })).toBeNull()
        expect(fanOutDispatchGaveUp({ attemptsMade: 5, attempts: 5, error: new Error('boom') })).toBe('exhausted')
        expect(fanOutDispatchGaveUp({ attemptsMade: 1, attempts: 5, error: new UnrecoverableError('job stalled more than allowable limit') })).toBe('unrecoverable')
        expect(fanOutDispatchGaveUp({ attemptsMade: 1, attempts: undefined, error: new Error('boom') })).toBe('exhausted')
    })

    it('clamps the batch size so a wide source cannot exceed the signal cap', async () => {
        const { flowRun } = await createFanOutParentRun()
        const previous = process.env.AP_MAX_BARRIER_SIGNALS
        process.env.AP_MAX_BARRIER_SIGNALS = '3'
        try {
            const created = await createFanOutBarrier({ flowRunId: flowRun.id, items: Array.from({ length: 12 }, (_, index) => index), batchSize: 1 })
            expect(created.signalCount).toBe(3)
            expect(created.batchSize).toBe(4)
        }
        finally {
            if (previous === undefined) {
                delete process.env.AP_MAX_BARRIER_SIGNALS
            }
            else {
                process.env.AP_MAX_BARRIER_SIGNALS = previous
            }
        }
    })
})
