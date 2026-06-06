import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { FlowActionType, FlowTriggerType, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { createPropsResolver } from '../../src/lib/variables/props-resolver'

const resolver = createPropsResolver({
    projectId: 'PROJECT_ID',
    engineToken: 'WORKER_TOKEN',
    apiUrl: 'http://127.0.0.1:3000',
    contextVersion: LATEST_CONTEXT_VERSION,
    stepNames: ['trigger', 'step_1'],
})

const buildState = async (): Promise<FlowExecutorContext> => {
    let state = await FlowExecutorContext.empty().upsertStep('trigger', GenericStepOutput.create({
        type: FlowTriggerType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: { name: 'John', body: { 'First Name': 'Jane' } },
    }))
    state = await state.upsertStep('step_1', GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.FAILED,
        input: {},
        output: undefined,
    }).setErrorMessage('boom'))
    return state
}

describe('props resolver — backward-compatible step references after output/error nesting', () => {
    let executionState: FlowExecutorContext
    beforeAll(async () => {
        executionState = await buildState()
    })

    it('resolves a bare dot reference to the step output (pre-nesting form)', async () => {
        const { resolvedInput } = await resolver.resolve({ unresolvedInput: '{{trigger.name}}', executionState })
        expect(resolvedInput).toEqual('John')
    })

    it('resolves a bare bracket reference with a spaced key (pre-nesting form)', async () => {
        const { resolvedInput } = await resolver.resolve({ unresolvedInput: '{{trigger[\'body\'][\'First Name\']}}', executionState })
        expect(resolvedInput).toEqual('Jane')
    })

    it('still resolves the nested output reference (v22 form)', async () => {
        const { resolvedInput } = await resolver.resolve({ unresolvedInput: '{{trigger[\'output\'][\'body\'][\'First Name\']}}', executionState })
        expect(resolvedInput).toEqual('Jane')
    })

    it('exposes the error accessor for a failed step', async () => {
        const { resolvedInput } = await resolver.resolve({ unresolvedInput: '{{step_1.error.message}}', executionState })
        expect(resolvedInput).toEqual('boom')
    })
})
