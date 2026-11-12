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

async function insideNestedLoopIteration({ outerStepName }: { outerStepName: string }): Promise<FlowExecutorContext> {
    const withOuterLoop = await FlowExecutorContext.empty().upsertStep('outer_loop', LoopStepOutput.init({ input: {} })
        .setItemAndIndex({ item: 1, index: 1 })
        .addIteration())
    const inOuterIteration = withOuterLoop.setCurrentPath(withOuterLoop.currentPath.loopIteration({ loopName: 'outer_loop', iteration: 0 }))
    const withOuterStep = await inOuterIteration.upsertStep(outerStepName, GenericStepOutput.create({
        input: {},
        type: FlowActionType.CODE,
        status: StepOutputStatus.SUCCEEDED,
    }).setOutput({ scoped: true }))
    const withInnerLoop = await withOuterStep.upsertStep('inner_loop', LoopStepOutput.init({ input: {} })
        .setItemAndIndex({ item: 1, index: 1 })
        .addIteration())
    return withInnerLoop.setCurrentPath(withInnerLoop.currentPath.loopIteration({ loopName: 'inner_loop', iteration: 0 }))
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
            batchStepName: 'batches',
            batchSize: 2,
            items: [1, 2, 3, 4, 5],
        })
    })

    it('hands over the waiting webhook caller so a response step after the batch still answers it', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ workerHandlerId: 'worker-1', httpRequestId: 'request-1' }),
        })

        expect(mockCreateWaitpoint.mock.calls[0][0]).toMatchObject({ workerHandlerId: 'worker-1', httpRequestId: 'request-1' })
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

    it('reports the item count the server kept for a retried hand-over, not the one it sent', async () => {
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            barrier: { signalCount: 2, batchSize: 2, totalItems: 4 },
        })
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3] }}',
            batchSize: 2,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.steps['batches'].output).toMatchObject({ totalItems: 4, batchSize: 2, total: 2 })
    })

    it('keys the barrier by the loop iteration path but sends the bare batch step name', async () => {
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
        expect(mockCreateWaitpoint.mock.calls[0][0].barrier.fanOut.batchStepName).toBe('batches')
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
        expect(JSON.stringify(result.verdict)).toContain('which belongs to the enclosing loop iteration')
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('fails the hand-over naming a step from an outer loop iteration when loops are nested', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ outer_step.output }}' } }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: await insideNestedLoopIteration({ outerStepName: 'outer_step' }),
            constants: generateMockEngineConstants({ stepNames: ['outer_step'] }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('outer_step')
        expect(JSON.stringify(result.verdict)).toContain('which belongs to the enclosing loop iteration')
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('does not mistake a step whose name starts with a loop-scoped step name for a reference to it', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ step_10.output }}' } }),
        })
        const executionState = await insideLoopIteration({
            stepName: 'step_1',
            executionState: await FlowExecutorContext.empty().upsertStep('step_10', GenericStepOutput.create({
                input: {},
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
            }).setOutput({ rows: [1] })),
        })

        const result = await flowExecutor.execute({
            action,
            executionState,
            constants: generateMockEngineConstants({ stepNames: ['step_1', 'step_10'] }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(Object.keys(mockCreateWaitpoint.mock.calls[0][0].barrier.fanOut.seedSteps)).toEqual(['step_10'])
    })

    it('ignores a loop-scoped step name outside an expression or in a skipped step', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({
                name: 'echo_step',
                input: { inner: 'inner' },
                nextAction: buildCodeAction({ name: 'echo_step_1', input: { value: '{{ inner.output }}' }, skip: true }),
            }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'inner' }),
            constants: generateMockEngineConstants({ stepNames: ['inner'] }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
    })

    it('seeds the enclosing loop with its current item only, not its past iterations', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ loop.item }}' } }),
        })

        await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'inner' }),
            constants: generateMockEngineConstants({ stepNames: ['inner', 'loop'] }),
        })

        expect(mockCreateWaitpoint.mock.calls[0][0].barrier.fanOut.seedSteps.loop.output).toEqual({ item: 1, index: 1 })
    })

    it('seeds a finished loop above the batch with its last item only, not its past iterations', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ done_loop.item }}' } }),
        })
        const executionState = await FlowExecutorContext.empty().upsertStep('done_loop', LoopStepOutput.init({ input: {} })
            .setItemAndIndex({ item: 'last', index: 3 })
            .addIteration()
            .addIteration()
            .addIteration())

        await flowExecutor.execute({
            action,
            executionState,
            constants: generateMockEngineConstants({ stepNames: ['done_loop'] }),
        })

        expect(mockCreateWaitpoint.mock.calls[0][0].barrier.fanOut.seedSteps.done_loop.output).toEqual({ item: 'last', index: 3 })
    })

    it('does not mistake a property named like a loop-scoped step for a reference to that step', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ trigger.body.id }}' } }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'body' }),
            constants: generateMockEngineConstants({ stepNames: ['body'] }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
    })

    it('refuses a loop-scoped reference when testing the step too', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ inner.output }}' } }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'inner' }),
            constants: generateMockEngineConstants({ stepNames: ['inner'], stepNameToTest: 'batches' }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('seeds a top-level reference when the batch step is inside a loop', async () => {
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

    it('succeeds with an empty summary and no barrier when the batch step has no body', async () => {
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

    it('continues the flow past items that are not a list when continue on failure is on', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ 5 }}',
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
            continueOnFailure: true,
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.RUNNING)
        expect(result.steps['batches'].status).toEqual(StepOutputStatus.FAILED)
        expect(result.steps['batches'].errorMessage).toContain('must be a list')
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('continues the flow past a loop-scoped reference when continue on failure is on', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: { value: '{{ inner.output }}' } }),
            continueOnFailure: true,
        })

        const result = await flowExecutor.execute({
            action,
            executionState: await insideLoopIteration({ stepName: 'inner' }),
            constants: generateMockEngineConstants({ stepNames: ['inner'] }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.RUNNING)
        expect(result.getStepOutput('batches')?.status).toEqual(StepOutputStatus.FAILED)
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
    })

    it('still fails a tested step on items that are not a list when continue on failure is on', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ 5 }}',
            continueOnFailure: true,
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNameToTest: 'batches' }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('keeps a refused hand-over fatal when continue on failure is on, because the server may already hold its barrier', async () => {
        mockCreateWaitpoint.mockRejectedValue(new Error('This step already started 2 batches, but its items now split into 3'))
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
            continueOnFailure: true,
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(mockCreateWaitpoint).toHaveBeenCalledTimes(1)
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

    it('fails the step when a batch was rejected and continue on failure is off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, rejected: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('1 of 1 batches did not succeed')
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
        expect(JSON.stringify(result.verdict)).toContain('1 of 1 batches did not succeed')
    })

    it('fails the step when a batch never dispatched and continue on failure is off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, notDispatched: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('1 of 1 batches did not succeed')
    })

    it('fails the step when a batch was canceled and continue on failure is off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, canceled: 1 }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('1 of 1 batches did not succeed')
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
        expect(JSON.stringify(result.verdict)).toContain('timed out with 1 of 1 batches unfinished')
    })

    it('counts batches never dispatched as unfinished when the deadline fired', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1,2] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 2, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 2, succeeded: 0, notDispatched: 2, timedOut: true }),
            }),
        })

        expect(JSON.stringify(result.verdict)).toContain('timed out with 2 of 2 batches unfinished')
    })

    it('succeeds with the summary when a batch failed and continue on failure is on', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1, continueOnFailure: true })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ total: 1, succeeded: 0, failed: 1, timedOut: true }),
            }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.RUNNING })
        expect(result.steps['batches'].status).toEqual(StepOutputStatus.SUCCEEDED)
        expect(result.steps['batches'].output).toMatchObject({ failed: 1, timedOut: true })
    })

    it('fails the step when the resume payload carries no summary', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({ resumePayload: { body: { nope: true }, headers: {}, queryParams: {} } }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('resumed without a batch summary')
    })

    it('fails the step when it resumes without the output it paused with', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })
        const executionState = await FlowExecutorContext.empty().upsertStep('batches', GenericStepOutput.create({
            input: {},
            type: FlowActionType.PROCESS_IN_BATCHES,
            status: StepOutputStatus.PAUSED,
        }))

        const result = await flowExecutor.execute({
            action,
            executionState,
            constants: generateMockEngineConstants({ resumePayload: releasedSummary() }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
        expect(JSON.stringify(result.verdict)).toContain('resumed without a batch summary')
    })
})
