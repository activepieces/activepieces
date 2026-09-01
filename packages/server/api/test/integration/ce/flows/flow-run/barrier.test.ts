import { apId } from '@activepieces/core-utils'
import { BarrierSignalStatus, BarrierSummary, ErrorCode, FlowRunStatus, FlowVersionState, MAX_SIGNAL_REASON_LENGTH, PauseType, RunEnvironment } from '@activepieces/shared'
import { UnrecoverableError } from 'bullmq'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { flowRunService } from '../../../../../src/app/flows/flow-run/flow-run-service'
import { barrierQueue } from '../../../../../src/app/waitpoints/barrier-queue'
import { barrierService } from '../../../../../src/app/waitpoints/barrier-service'
import { fanOutDispatchGaveUp, handleFanOutDispatch, handleFanOutDispatchGaveUp } from '../../../../../src/app/waitpoints/fan-out-dispatcher-job'
import { handleResumeDelayWaitpoint } from '../../../../../src/app/waitpoints/resume-delay-handler'
import { resumeService } from '../../../../../src/app/waitpoints/resume-service'
import { sweepOverdueDeadlines } from '../../../../../src/app/waitpoints/waitpoint-deadline-sweep'
import { waitpointService } from '../../../../../src/app/waitpoints/waitpoint-service'
import { Waitpoint, WaitpointStatus } from '../../../../../src/app/waitpoints/waitpoint-types'
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

async function createBarrier({ flowRunId, signalLabels, policy, stepName }: {
    flowRunId: string
    signalLabels: (string | null)[]
    policy?: { requiredSuccesses?: number, releaseOnFirstFailure?: boolean }
    stepName?: string
}) {
    return barrierService(app.log).create({
        flowRunId,
        projectId: ctx.project.id,
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

async function giveUp(barrierId: string) {
    return handleFanOutDispatchGaveUp({
        data: { barrierId, projectId: ctx.project.id },
        error: new Error('worker died'),
        reason: 'exhausted',
        log: app.log,
    })
}

async function createFanOutBarrier({ flowRunId, items, batchSize, stepName }: {
    flowRunId: string
    items: unknown[]
    batchSize: number
    stepName?: string
}) {
    return barrierService(app.log).create({
        flowRunId,
        projectId: ctx.project.id,
        stepName: stepName ?? 'fan_out',
        version: 'V1',
        fanOut: {
            entryStepName: 'trigger',
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

async function waitFor(condition: () => Promise<boolean>): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await condition()) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('Timed out waiting for the barrier to settle')
}

async function readStatus(barrierId: string): Promise<WaitpointStatus> {
    const barrier = await db.findOneByOrFail<{ status: WaitpointStatus }>('waitpoint', { id: barrierId })
    return barrier.status
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
})

describe('evaluation coalescing', () => {
    it('clears the deduplication key before evaluating, so a signal landing mid-job is not swallowed', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })
        const queue = barrierQueue(app.log).get()
        await queue.pause()
        try {
            await queue.drain(true)
            await barrierQueue(app.log).enqueueEvaluation({ barrierId: barrier.id, projectId: ctx.project.id })
            await barrierQueue(app.log).enqueueEvaluation({ barrierId: barrier.id, projectId: ctx.project.id })
            const beforeHandling = await queue.getJobCountByTypes('waiting', 'delayed', 'prioritized', 'paused')

            await barrierQueue(app.log).clearEvaluationDedupKey(barrier.id)
            await barrierQueue(app.log).enqueueEvaluation({ barrierId: barrier.id, projectId: ctx.project.id })
            const afterHandling = await queue.getJobCountByTypes('waiting', 'delayed', 'prioritized', 'paused')

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
})

describe('barrier deadline', () => {
    it('carries a deadline from creation, so a barrier nobody signals is still swept and released', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        expect(barrier.resumeDateTime).not.toBeNull()

        await db.update('waitpoint', barrier.id, { resumeDateTime: dayjs().subtract(5, 'minute').toISOString() })
        const rearmed = await sweepOverdueDeadlines({ log: app.log })
        expect(rearmed).toContain(barrier.id)

        await handleResumeDelayWaitpoint({
            data: { flowRunId: flowRun.id, projectId: ctx.project.id, waitpointId: barrier.id },
            log: app.log,
        })

        expect(await readStatus(barrier.id)).toBe(WaitpointStatus.CONSUMED)
        expect(await listSignals(barrier.id)).toHaveLength(0)
    })

    it('counts the signals nobody answered as still running and marks the release as timed out', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        const { barrier } = await createBarrier({ flowRunId: flowRun.id, signalLabels: ['a@example.com', 'b@example.com'] })

        await barrierService(app.log).release({ barrier, timedOut: true, releaseReason: 'timeout' })

        const summary = await readSummary(barrier.id)
        expect(summary.timedOut).toBe(true)
        expect(summary.stillRunning).toBe(2)
    })
})

describe('multi-approval confirm page', () => {
    async function createApprovalBarrier({ reasonRequiredOn, requiredSuccesses }: { reasonRequiredOn?: 'none' | 'reject' | 'both', requiredSuccesses?: number } = {}) {
        const { flowRun } = await createParentRun()
        const created = await barrierService(app.log).create({
            flowRunId: flowRun.id,
            projectId: ctx.project.id,
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
        const { flowRun } = await createParentRun()
        const { barrier, signalCount } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4, 5, 6], batchSize: 2 })
        expect(signalCount).toBe(3)

        await Promise.all([
            handleFanOutDispatch({ data: { barrierId: barrier.id, projectId: ctx.project.id }, log: app.log }),
            handleFanOutDispatch({ data: { barrierId: barrier.id, projectId: ctx.project.id }, log: app.log }),
        ])
        await waitFor(async () => (await listChildren(barrier.id)).length >= 3)
        await handleFanOutDispatch({ data: { barrierId: barrier.id, projectId: ctx.project.id }, log: app.log })

        const children = await listChildren(barrier.id)
        expect(children).toHaveLength(3)
        expect(children.map((child) => child.dispatchIndex).sort()).toEqual([0, 1, 2])
    })

    it('stops without dispatching when the barrier was cancelled, and its signals are gone by cascade', async () => {
        const { flowRun } = await createParentRun()
        const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })

        await waitpointService(app.log).deleteByFlowRunId(flowRun.id)
        expect(await listSignals(barrier.id)).toHaveLength(0)
        const beforeCancel = (await listChildren(barrier.id)).length

        await expect(handleFanOutDispatch({ data: { barrierId: barrier.id, projectId: ctx.project.id }, log: app.log })).resolves.toBeUndefined()

        expect(await listChildren(barrier.id)).toHaveLength(beforeCancel)
    })

    it('refuses to attribute a child to a barrier that already released, so a timeout mid-dispatch cannot leak children', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            await barrierService(app.log).release({ barrier, timedOut: true, releaseReason: 'timeout' })
            expect((await db.findOneBy('waitpoint', { id: barrier.id })).status).toBe(WaitpointStatus.COMPLETED)

            const target = await flowRunService(app.log).prepareChildDispatch({
                projectId: ctx.project.id,
                parentRunId: flowRun.id,
                entryStepName: 'trigger',
            })
            await expect(flowRunService(app.log).dispatchChild({
                target,
                childRunId: apId(),
                seedSteps: {},
                parentWaitpointId: barrier.id,
                dispatchIndex: 0,
                dispatchKey: 'after-release',
            })).rejects.toThrow(ErrorCode.ENTITY_NOT_FOUND)

            expect(await listChildren(barrier.id)).toHaveLength(0)
        })
    })

    it('stops dispatching when the barrier releases mid-flight', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            await barrierService(app.log).release({ barrier, timedOut: true, releaseReason: 'timeout' })

            await expect(handleFanOutDispatch({ data: { barrierId: barrier.id, projectId: ctx.project.id }, log: app.log })).resolves.toBeUndefined()

            expect(await listChildren(barrier.id)).toHaveLength(0)
        })
    })

    it('refuses to attribute a child to a barrier that no longer resolves', async () => {
        const { flowRun } = await createParentRun()

        const target = await flowRunService(app.log).prepareChildDispatch({
            projectId: ctx.project.id,
            parentRunId: flowRun.id,
            entryStepName: 'trigger',
        })
        await expect(flowRunService(app.log).dispatchChild({
            target,
            childRunId: apId(),
            seedSteps: {},
            parentWaitpointId: apId(),
            dispatchIndex: 0,
            dispatchKey: 'nope',
        })).rejects.toThrow(ErrorCode.ENTITY_NOT_FOUND)
    })

    it('refuses to resolve a dispatch target for a parent run outside the project', async () => {
        await expect(flowRunService(app.log).prepareChildDispatch({
            projectId: ctx.project.id,
            parentRunId: apId(),
            entryStepName: 'trigger',
        })).rejects.toThrow(ErrorCode.VALIDATION)
    })

    it('refuses to resolve a dispatch target for a step the flow version does not have', async () => {
        const { flowRun } = await createParentRun()

        await expect(flowRunService(app.log).prepareChildDispatch({
            projectId: ctx.project.id,
            parentRunId: flowRun.id,
            entryStepName: 'step_does_not_exist',
        })).rejects.toThrow(ErrorCode.VALIDATION)
    })

    it('marks the rest undispatched when dispatch exhausts its attempts, so the barrier releases now', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })

            await giveUp(barrier.id)
            await releaseIfReady(barrier.id)

            const summary = await readSummary(barrier.id)
            expect(summary.notDispatched).toBe(4)
            expect(summary.total).toBe(4)
        })
    })

    it('spares the signals whose children are already live when dispatch gives up', async () => {
        const { flowRun } = await createParentRun(FlowRunStatus.RUNNING)
        await withBarrierQueuePaused(async () => {
            const { barrier } = await createFanOutBarrier({ flowRunId: flowRun.id, items: [1, 2, 3, 4], batchSize: 1 })
            const signals = await barrierService(app.log).listUnclaimedSignals({ barrierId: barrier.id, projectId: ctx.project.id })
            const claimedRefIds = [apId(), apId()]
            expect(await barrierService(app.log).claimSignal({ signalId: signals[0].id, refId: claimedRefIds[0], projectId: ctx.project.id })).toBe(true)
            expect(await barrierService(app.log).claimSignal({ signalId: signals[1].id, refId: claimedRefIds[1], projectId: ctx.project.id })).toBe(true)

            await giveUp(barrier.id)
            await releaseIfReady(barrier.id)

            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)
            const afterGiveUp = await listSignals(barrier.id)
            expect(afterGiveUp.filter((signal) => signal.status === BarrierSignalStatus.PENDING).map((signal) => signal.refId).sort()).toEqual([...claimedRefIds].sort())
            expect(afterGiveUp.filter((signal) => signal.status === BarrierSignalStatus.NOT_DISPATCHED)).toHaveLength(2)

            expect(await barrierService(app.log).claimSignal({ signalId: signals[2].id, refId: apId(), projectId: ctx.project.id })).toBe(false)
            expect(await barrierService(app.log).listUnclaimedSignals({ barrierId: barrier.id, projectId: ctx.project.id })).toHaveLength(0)

            await receiveSignal({ signalId: signals[0].id, status: BarrierSignalStatus.SUCCEEDED })
            await releaseIfReady(barrier.id)
            expect(await readStatus(barrier.id)).toBe(WaitpointStatus.PENDING)

            await receiveSignal({ signalId: signals[1].id, status: BarrierSignalStatus.SUCCEEDED })
            await releaseIfReady(barrier.id)

            const summary = await readSummary(barrier.id)
            expect(summary).toMatchObject({ total: 4, succeeded: 2, notDispatched: 2, stillRunning: 0 })
        })
    })

    it('gives up on an unrecoverable failure and on the last attempt, but not mid-ladder', async () => {
        expect(fanOutDispatchGaveUp({ attemptsMade: 1, attempts: 5, error: new Error('boom') })).toBeNull()
        expect(fanOutDispatchGaveUp({ attemptsMade: 4, attempts: 5, error: new Error('boom') })).toBeNull()
        expect(fanOutDispatchGaveUp({ attemptsMade: 5, attempts: 5, error: new Error('boom') })).toBe('exhausted')
        expect(fanOutDispatchGaveUp({ attemptsMade: 1, attempts: 5, error: new UnrecoverableError('job stalled more than allowable limit') })).toBe('unrecoverable')
        expect(fanOutDispatchGaveUp({ attemptsMade: 1, attempts: undefined, error: new Error('boom') })).toBe('exhausted')
    })

    it('clamps the batch size so a wide source cannot exceed the signal cap', async () => {
        const { flowRun } = await createParentRun()
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
