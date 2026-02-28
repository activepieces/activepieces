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

function getNodeData(flow: FlowVersion, id: string) {
    const node = flow.graph.nodes.find(n => n.id === id)
    return node?.data as Record<string, unknown> | undefined
}

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
        expect(getNodeData(result, 'step_1')!.skip).toBe(true)
    })

    it('should skip multiple actions', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createCodeAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: {
                names: ['step_1', 'step_2'],
                skip: true,
            },
        })
        expect(getNodeData(result, 'step_1')!.skip).toBe(true)
        expect(getNodeData(result, 'step_2')!.skip).toBe(true)
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
        expect(getNodeData(result, 'step_1')!.skip).toBe(false)
    })

    it('should leave non-targeted actions unchanged', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createCodeAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.SET_SKIP_ACTION,
            request: { names: ['step_1'], skip: true },
        })
        expect(getNodeData(result, 'step_1')!.skip).toBe(true)
        expect(getNodeData(result, 'step_2')!.skip).toBeUndefined()
    })

    it('should consider skipped steps when calculating flow validity', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        const invalidStep = createCodeAction()
        invalidStep.valid = false
        invalidStep.settings = { input: {} } as typeof invalidStep.settings
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: invalidStep },
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
