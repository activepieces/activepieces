import { attachFailureOutput, FlowActionType, FlowRunStatus, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { failStep } from '../../src/lib/handler/base-executor'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'

const action = { name: 'extract_step', displayName: 'Extract Structured Data' }

function makeStepOutput(): GenericStepOutput<FlowActionType.PIECE, unknown> {
    return GenericStepOutput.create({
        input: {},
        type: FlowActionType.PIECE,
        status: StepOutputStatus.RUNNING,
    })
}

describe('failStep', () => {
    it('persists a failure output attached to the error into the FAILED step', async () => {
        const usage = {
            version: 1,
            calls: [{ model: 'gpt-4o-2024-11-20', inputTokens: 80, outputTokens: 12 }],
            totals: { inputTokens: 80, outputTokens: 12 },
        }
        const error = attachFailureOutput(new Error('No structured data could be extracted'), { usage })

        const result = await failStep({
            action,
            executionState: FlowExecutorContext.empty(),
            stepOutput: makeStepOutput(),
            error,
        })

        const step = result.getStepOutput(action.name)
        expect(step?.status).toBe(StepOutputStatus.FAILED)
        expect(step?.output).toEqual({ usage })
        expect(step?.errorMessage).toContain('No structured data could be extracted')
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
    })

    it('leaves the step output untouched when the error carries no marker', async () => {
        const result = await failStep({
            action,
            executionState: FlowExecutorContext.empty(),
            stepOutput: makeStepOutput(),
            error: new Error('boom'),
        })

        const step = result.getStepOutput(action.name)
        expect(step?.status).toBe(StepOutputStatus.FAILED)
        expect(step?.output).toBeUndefined()
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
    })

    it('does not read a marker attached to a string error', async () => {
        const result = await failStep({
            action,
            executionState: FlowExecutorContext.empty(),
            stepOutput: makeStepOutput(),
            error: 'plain failure text',
        })

        const step = result.getStepOutput(action.name)
        expect(step?.status).toBe(StepOutputStatus.FAILED)
        expect(step?.output).toBeUndefined()
        expect(step?.errorMessage).toBe('plain failure text')
    })
})
