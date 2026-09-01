import { BarrierSignalStatus, FlowActionType, FlowRunStatus, GenericStepOutput, LoopStepOutput, PauseType, StepOutputStatus } from '@activepieces/shared'
import { vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildProcessInBatchesAction, generateMockEngineConstants } from './test-helper'

const { mockCreateWaitpoint } = vi.hoisted(() => ({
    mockCreateWaitpoint: vi.fn(),
}))

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: mockCreateWaitpoint,
    },
}))

function releasedSummary(overrides: Record<string, unknown> = {}) {
    return {
        body: {
            total: 3,
            succeeded: 3,
            failed: 0,
            rejected: 0,
            canceled: 0,
            notDispatched: 0,
            stillRunning: 0,
            timedOut: false,
            signals: [],
            ...overrides,
        },
        headers: {},
        queryParams: {},
    }
}

async function insideLoopIteration({ stepName, executionState }: { stepName: string, executionState?: FlowExecutorContext }): Promise<FlowExecutorContext> {
    const withLoop = await (executionState ?? FlowExecutorContext.empty()).upsertStep('loop', LoopStepOutput.init({ input: {} })
        .setItemAndIndex({ item: 1, index: 1 })
        .addIteration())
    const inIteration = withLoop.setCurrentPath(withLoop.currentPath.loopIteration({ loopName: 'loop', iteration: 0 }))
    return inIteration.upsertStep(stepName, GenericStepOutput.create({
        input: {},
        type: FlowActionType.CODE,
        status: StepOutputStatus.SUCCEEDED,
    }).setOutput({ scoped: true }))
}

async function pausedStateFor({ stepName, totalItems, batchSize }: {
    stepName: string
    totalItems: number
    batchSize: number
}): Promise<FlowExecutorContext> {
    return FlowExecutorContext.empty().upsertStep(stepName, GenericStepOutput.create({
        input: {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.PAUSED,
    }).setOutput({ barrierId: 'barrier-id', totalItems, batchSize }))
}

describe('process in batches executor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            barrier: { signalCount: 3, batchSize: 2 },
        })
    })

    it('hands the whole source over in one call and pauses', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3,4,5] }}',
            batchSize: 2,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(mockCreateWaitpoint).toHaveBeenCalledTimes(1)
        const [call] = mockCreateWaitpoint.mock.calls[0]
        expect(call.type).toBe(PauseType.BARRIER)
        expect(call.stepName).toBe('batches')
        expect(call.barrier.fanOut).toMatchObject({
            entryStepName: 'echo_step',
            batchSize: 2,
            items: [1, 2, 3, 4, 5],
        })
    })

    it('pauses carrying the barrier id and the sizing the run detail browses batches with', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3,4,5] }}',
            batchSize: 2,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.steps['batches'].output).toEqual({
            barrierId: 'barrier-id',
            totalItems: 5,
            batchSize: 2,
            total: 3,
        })
    })

    it('reports the batch size the server clamped to, not the one it asked for', async () => {
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            barrier: { signalCount: 2, batchSize: 3 },
        })
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3,4,5] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.steps['batches'].output).toMatchObject({ batchSize: 3, total: 2 })
    })

    it('path-keys the barrier when the step runs inside a loop iteration', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'inner' }),
            constants: generateMockEngineConstants({ stepNames: ['inner'] }),
        })

        expect(mockCreateWaitpoint.mock.calls[0][0].stepName).toBe('loop:0/batches')
    })

    it('seeds only the steps the body references, with slice refs left intact', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ referenced.output.rows }}' } }),
        })
        let executionState = await FlowExecutorContext.empty().upsertStep('referenced', GenericStepOutput.create({
            input: {},
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
        }).setOutput({ rows: [1, 2] }))
        executionState = await executionState.upsertStep('unreferenced', GenericStepOutput.create({
            input: {},
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
        }).setOutput({ rows: [3] }))

        await flowExecutor.execute({
            action,
            executionState,
            constants: generateMockEngineConstants({ stepNames: ['referenced', 'unreferenced'] }),
        })

        const seedSteps = mockCreateWaitpoint.mock.calls[0][0].barrier.fanOut.seedSteps
        expect(Object.keys(seedSteps)).toEqual(['referenced'])
    })

    it('fails the hand-over naming a step that only exists in the enclosing loop iteration', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ inner.output }}' } }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'inner' }),
            constants: generateMockEngineConstants({ stepNames: ['inner'] }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('inner')
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('seeds a top-level reference normally from inside a loop-nested container', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ top_level.output }}' } }),
        })
        let executionState = await FlowExecutorContext.empty().upsertStep('top_level', GenericStepOutput.create({
            input: {},
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
        }).setOutput({ rows: [1] }))
        executionState = await insideLoopIteration({ stepName: 'inner', executionState })

        const result = await flowExecutor.execute({
            action,
            executionState,
            constants: generateMockEngineConstants({ stepNames: ['inner', 'top_level'] }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(Object.keys(mockCreateWaitpoint.mock.calls[0][0].barrier.fanOut.seedSteps)).toEqual(['top_level'])
    })

    it('skips an empty items array with a well-formed all-zero summary', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [] }}',
            batchSize: 2,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.RUNNING })
        expect(result.steps['batches'].output).toEqual({
            barrierId: null,
            totalItems: 0,
            batchSize: 2,
            total: 0,
            succeeded: 0,
            failed: 0,
            rejected: 0,
            canceled: 0,
            notDispatched: 0,
            stillRunning: 0,
            timedOut: false,
            signals: [],
        })
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('does not claim an items array when the container has no body', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1,2,3] }}', batchSize: 2 })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.steps['batches'].output).toMatchObject({ totalItems: 3, batchSize: 2, total: 0 })
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('fails the step when items is not an array', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ 5 }}',
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('fails the step when the server refuses the hand-over', async () => {
        mockCreateWaitpoint.mockRejectedValue(new Error('This step waits on too many things'))
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('resumes with the released summary as the step output', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1,2,3] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 3, batchSize: 1 }),
            constants: generateMockEngineConstants({ resumePayload: releasedSummary() }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.RUNNING })
        expect(result.steps['batches'].output).toEqual({
            barrierId: 'barrier-id',
            totalItems: 3,
            batchSize: 1,
            total: 3,
            succeeded: 3,
            failed: 0,
            rejected: 0,
            canceled: 0,
            notDispatched: 0,
            stillRunning: 0,
            timedOut: false,
            signals: [],
        })
    })

    it('reports each batch outcome as a signal', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1,2,3,4,5] }}', batchSize: 2, continueOnFailure: true })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 5, batchSize: 2 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({
                    total: 3,
                    succeeded: 1,
                    failed: 1,
                    notDispatched: 1,
                    signals: [
                        { sequence: 0, label: null, outcome: BarrierSignalStatus.SUCCEEDED, result: null, runId: 'child-0' },
                        { sequence: 1, label: null, outcome: BarrierSignalStatus.FAILED, result: null, runId: 'child-1' },
                        { sequence: 2, label: null, outcome: BarrierSignalStatus.NOT_DISPATCHED, result: null, runId: null },
                    ],
                }),
            }),
        })

        expect(result.steps['batches'].output).toMatchObject({
            total: 3,
            succeeded: 1,
            failed: 1,
            notDispatched: 1,
            signals: [
                { sequence: 0, outcome: BarrierSignalStatus.SUCCEEDED, runId: 'child-0' },
                { sequence: 1, outcome: BarrierSignalStatus.FAILED, runId: 'child-1' },
                { sequence: 2, outcome: BarrierSignalStatus.NOT_DISPATCHED, runId: null },
            ],
        })
    })

    it('fails the step when a batch was rejected, even with continue on failure off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, rejected: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('fails the step on a failed batch when continue on failure is off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, failed: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('fails the step when a batch never dispatched, even with continue on failure off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, notDispatched: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('fails the step when a batch was canceled, even with continue on failure off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, canceled: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('fails the step when the deadline fired, even with no failed batch', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, stillRunning: 1, timedOut: true }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('timed out')
    })

    it('fails the step when the resume payload carries no summary', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({ resumePayload: { body: { nope: true }, headers: {}, queryParams: {} } }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })
})
