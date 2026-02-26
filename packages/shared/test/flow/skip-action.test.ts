import {
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithSimpleAction,
} from './test-utils'

describe('Skip Action', () => {
    it('should skip single action', () => {
        const flow = createFlowVersionWithSimpleAction()
        const op: FlowOperationRequest = {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: {
                names: ['step_1'],
                skip: true,
            },
        }
        const result = flowOperations.apply(flow, op)
        expect(result.steps.find(s => s.name === 'step_1')!.skip).toBe(true)
    })

    it('should skip multiple actions', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createCodeAction('step_1') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction('step_2') },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: {
                names: ['step_1', 'step_2'],
                skip: true,
            },
        })
        expect(result.steps.find(s => s.name === 'step_1')!.skip).toBe(true)
        expect(result.steps.find(s => s.name === 'step_2')!.skip).toBe(true)
    })

    it('should unskip action', () => {
        let flow = createFlowVersionWithSimpleAction()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: { names: ['step_1'], skip: true },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: { names: ['step_1'], skip: false },
        })
        expect(result.steps.find(s => s.name === 'step_1')!.skip).toBe(false)
    })

    it('should leave non-targeted actions unchanged', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createCodeAction('step_1') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction('step_2') },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: { names: ['step_1'], skip: true },
        })
        expect(result.steps.find(s => s.name === 'step_1')!.skip).toBe(true)
        expect(result.steps.find(s => s.name === 'step_2')!.skip).toBeUndefined()
    })

    it('should consider skipped steps when calculating flow validity', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        const invalidStep = createCodeAction('step_1')
        invalidStep.valid = false
        invalidStep.settings = { input: {} } as typeof invalidStep.settings
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: invalidStep },
        })
        // Flow should be invalid because step_1 is invalid
        expect(flow.valid).toBe(false)
        // Skip the invalid step
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: { names: ['step_1'], skip: true },
        })
        // Flow should be valid because the invalid step is skipped
        expect(result.valid).toBe(true)
    })
})
