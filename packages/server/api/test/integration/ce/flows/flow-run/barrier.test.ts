import { apId } from '@activepieces/core-utils'
import { BarrierSignalStatus, BarrierSummary, FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { barrierQueue } from '../../../../../src/app/waitpoints/barrier-queue'
import { barrierService } from '../../../../../src/app/waitpoints/barrier-service'
import { resumeService } from '../../../../../src/app/waitpoints/resume-service'
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
