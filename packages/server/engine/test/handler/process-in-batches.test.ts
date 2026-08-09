import { FlowActionType, FlowRunStatus, GenericStepOutput, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildProcessInBatchesAction, generateMockEngineConstants } from './test-helper'

const { mockCreateWaitpoint, mockSealFanIn, mockDispatch } = vi.hoisted(() => ({
    mockCreateWaitpoint: vi.fn(),
    mockSealFanIn: vi.fn(),
    mockDispatch: vi.fn(),
}))

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: mockCreateWaitpoint,
        seal: mockSealFanIn,
    },
}))

vi.mock('../../src/lib/piece-context/child-run-client', () => ({
    childRunClient: {
        dispatch: mockDispatch,
    },
}))

function releasedSummary(overrides: Record<string, unknown> = {}) {
    return {
        body: {
            expected: 3,
            succeeded: 3,
            failed: 0,
            canceled: 0,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 0,
            timedOut: false,
            exceptions: [],
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

async function pausedStateFor({ stepName, totalItems, batchSize, failedToDispatchIndices }: {
    stepName: string
    totalItems: number
    batchSize: number
    failedToDispatchIndices?: number[]
}): Promise<FlowExecutorContext> {
    return FlowExecutorContext.empty().upsertStep(stepName, GenericStepOutput.create({
        input: {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.PAUSED,
    }).setOutput({ totalItems, batchSize, failedToDispatchIndices: failedToDispatchIndices ?? [] }))
}

describe('process in batches executor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCreateWaitpoint.mockResolvedValue({ id: 'barrier-id', resumeUrl: 'http://localhost/resume' })
        mockSealFanIn.mockResolvedValue({ expectedChildren: 0, alreadySealed: false, released: false, timeoutAt: '2030-01-01T00:00:00.000Z' })
        mockDispatch.mockResolvedValue({ id: 'child-id', attributedToBarrier: true })
    })

    it('dispatches one child per batch, each carrying its slice of the items', async () => {
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
        expect(mockDispatch).toHaveBeenCalledTimes(3)
        const slices = mockDispatch.mock.calls.map(([call]) => call.seedSteps['batches'].output.items)
        expect(slices.sort()).toEqual([[1, 2], [3, 4], [5]].sort())
        expect(mockDispatch.mock.calls.map(([call]) => call.dispatchIndex).sort()).toEqual([0, 1, 2])
        expect(mockDispatch.mock.calls.every(([call]) => call.entryStepName === 'echo_step' && call.parentWaitpointId === 'barrier-id')).toBe(true)
    })

    it('creates the barrier with the intended child count and a digest before dispatching', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(mockCreateWaitpoint).toHaveBeenCalledWith(expect.objectContaining({
            isFanIn: true,
            intendedChildren: 3,
            stepName: 'batches',
            dispatchDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
        }))
    })

    it('seals with the accepted child count and no deadline, so the platform bound applies', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(mockSealFanIn).toHaveBeenCalledWith(expect.objectContaining({
            waitpointId: 'barrier-id',
            expectedChildren: 2,
            failedToDispatch: 0,
        }))
        expect(mockSealFanIn.mock.calls[0][0].timeoutAt).toBeUndefined()
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

        const seedSteps = mockDispatch.mock.calls[0][0].seedSteps
        expect(Object.keys(seedSteps).sort()).toEqual(['batches', 'referenced'])
    })

    it('fails dispatch naming a step that only exists in the enclosing loop iteration', async () => {
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
        expect(mockDispatch).not.toHaveBeenCalled()
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
        expect(Object.keys(mockDispatch.mock.calls[0][0].seedSteps).sort()).toEqual(['batches', 'top_level'])
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
            expected: 0,
            succeeded: 0,
            failed: 0,
            canceled: 0,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 0,
            timedOut: false,
            exceptions: [],
        })
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

    it('throws when the first batch is rejected, leaving nothing dispatched', async () => {
        mockDispatch.mockRejectedValueOnce(new Error('rejected'))
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
        expect(mockDispatch).toHaveBeenCalledTimes(1)
        expect(mockSealFanIn).not.toHaveBeenCalled()
    })

    it('tolerates a later rejected dispatch and seals with the accepted count', async () => {
        mockDispatch
            .mockResolvedValueOnce({ id: 'child-0', attributedToBarrier: true })
            .mockRejectedValueOnce(new Error('rejected'))
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

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(mockSealFanIn).toHaveBeenCalledWith(expect.objectContaining({
            expectedChildren: 2,
            failedToDispatch: 1,
        }))
    })

    it('dispatches only the batches whose indices are absent when re-entering after a crash', async () => {
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            fanIn: { sealed: false, expectedChildren: null, dispatchedIndices: [0, 2] },
        })
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3,4] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(mockDispatch.mock.calls.map(([call]) => call.dispatchIndex).sort()).toEqual([1, 3])
        expect(mockSealFanIn).toHaveBeenCalledWith(expect.objectContaining({ expectedChildren: 4, failedToDispatch: 0 }))
    })

    it('computes the complement from the dispatched indices, so a gap below the highest present index is sent', async () => {
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            fanIn: { sealed: false, expectedChildren: null, dispatchedIndices: [0, 1, 2, 4] },
        })
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3,4,5] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(mockDispatch).toHaveBeenCalledTimes(1)
        expect(mockDispatch.mock.calls[0][0].dispatchIndex).toBe(3)
        expect(mockDispatch.mock.calls[0][0].seedSteps['batches'].output.items).toEqual([4])
    })

    it('counts a rejected complement dispatch instead of throwing, because children are already running', async () => {
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            fanIn: { sealed: false, expectedChildren: null, dispatchedIndices: [0] },
        })
        mockDispatch.mockRejectedValueOnce(new Error('rejected'))
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

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(mockDispatch).toHaveBeenCalledTimes(2)
        expect(mockSealFanIn).toHaveBeenCalledWith(expect.objectContaining({ expectedChildren: 2, failedToDispatch: 1 }))
    })

    it('dispatches nothing when the barrier it re-enters is already sealed', async () => {
        mockCreateWaitpoint.mockResolvedValue({
            id: 'barrier-id',
            resumeUrl: 'http://localhost/resume',
            fanIn: { sealed: true, expectedChildren: 2, dispatchedIndices: [0, 1] },
        })
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

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('counts a batch the server could not attach to the barrier as a dispatch failure', async () => {
        mockDispatch
            .mockResolvedValueOnce({ id: 'child-0', attributedToBarrier: true })
            .mockResolvedValueOnce({ id: 'orphan', attributedToBarrier: false })
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

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(mockSealFanIn).toHaveBeenCalledWith(expect.objectContaining({ expectedChildren: 2, failedToDispatch: 1 }))
    })

    it('fails the step when the server refuses the re-entry, dispatching nothing', async () => {
        mockCreateWaitpoint.mockRejectedValue(new Error('This fan-in step already dispatched subflows for a different set of items'))
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
        expect(mockDispatch).not.toHaveBeenCalled()
        expect(mockSealFanIn).not.toHaveBeenCalled()
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
            expected: 3,
            succeeded: 3,
            failed: 0,
            canceled: 0,
            stillRunning: 0,
            notStarted: 0,
            failedToDispatch: 0,
            timedOut: false,
            exceptions: [],
        })
    })

    it('reports each failed, never-started and failed-to-dispatch batch with its item range', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1,2,3,4,5] }}', batchSize: 2, continueOnFailure: true })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 5, batchSize: 2, failedToDispatchIndices: [2] }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({
                    expected: 3,
                    succeeded: 1,
                    failed: 1,
                    notStarted: 0,
                    failedToDispatch: 1,
                    exceptions: [
                        { runId: 'child-1', dispatchIndex: 1 },
                        { runId: null, dispatchIndex: 2 },
                    ],
                }),
            }),
        })

        expect(result.steps['batches'].output).toMatchObject({
            exceptions: [
                { batchIndex: 1, itemStart: 2, itemCount: 2, status: 'failed', childRunId: 'child-1' },
                { batchIndex: 2, itemStart: 4, itemCount: 1, status: 'failedToDispatch', childRunId: null },
            ],
        })
    })

    it('fails the step on a failed batch when continue on failure is off', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1 })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ expected: 1, succeeded: 0, failed: 1, exceptions: [{ runId: 'child-0', dispatchIndex: 0 }] }),
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
                resumePayload: releasedSummary({ expected: 1, succeeded: 0, stillRunning: 1, timedOut: true }),
            }),
        })

        expect(result.verdict.status).toEqual(FlowRunStatus.FAILED)
    })

    it('succeeds with the truthful counts when continue on failure is on', async () => {
        const action = buildProcessInBatchesAction({ name: 'batches', items: '{{ [1] }}', batchSize: 1, continueOnFailure: true })

        const result = await flowExecutor.execute({
            action,
            executionState: await pausedStateFor({ stepName: 'batches', totalItems: 1, batchSize: 1 }),
            constants: generateMockEngineConstants({
                resumePayload: releasedSummary({ expected: 1, succeeded: 0, failed: 1, exceptions: [{ runId: 'child-0', dispatchIndex: 0 }] }),
            }),
        })

        expect(result.verdict).toEqual({ status: FlowRunStatus.RUNNING })
        expect(result.steps['batches'].output).toMatchObject({ failed: 1, succeeded: 0 })
    })

    it('never dispatches again once it already produced a summary', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3] }}',
            batchSize: 1,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })
        const alreadyDone = await FlowExecutorContext.empty().upsertStep('batches', GenericStepOutput.create({
            input: {},
            type: FlowActionType.PROCESS_IN_BATCHES,
            status: StepOutputStatus.SUCCEEDED,
        }).setOutput({ expected: 3, succeeded: 3 }))

        const result = await flowExecutor.execute({
            action,
            executionState: alreadyDone,
            constants: generateMockEngineConstants(),
        })

        expect(mockDispatch).not.toHaveBeenCalled()
        expect(mockCreateWaitpoint).not.toHaveBeenCalled()
        expect(result.steps['batches'].output).toEqual({ expected: 3, succeeded: 3 })
    })

    it('resolves the items and shows the first batch when the step is tested', async () => {
        const action = buildProcessInBatchesAction({
            name: 'batches',
            items: '{{ [1,2,3] }}',
            batchSize: 2,
            firstLoopAction: buildCodeAction({ name: 'echo_step', input: {} }),
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNameToTest: 'batches' }),
        })

        expect(result.steps['batches'].output).toEqual({ items: [1, 2] })
        expect(mockDispatch).not.toHaveBeenCalled()
    })
})
