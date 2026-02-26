import {
    FlowActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    LoopOnItemsAction,
    RouterAction,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithLoop,
    createFlowVersionWithRouter,
    createFlowVersionWithSimpleAction,
    createLoopAction,
} from './test-utils'

describe('Delete Action', () => {
    it('should delete single action from trigger.steps', () => {
        const flow = createFlowVersionWithSimpleAction()
        const op: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        }
        const result = flowOperations.apply(flow, op)
        expect(result.trigger.steps).not.toContain('step_1')
        expect(result.steps.find(s => s.name === 'step_1')).toBeUndefined()
    })

    it('should delete action from inside loop children', () => {
        const flow = createFlowVersionWithLoop()
        const op: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_2'] },
        }
        const result = flowOperations.apply(flow, op)
        const loopStep = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(loopStep.children).not.toContain('step_2')
        expect(result.steps.find(s => s.name === 'step_2')).toBeUndefined()
    })

    it('should delete action from inside router branch', () => {
        const flow = createFlowVersionWithRouter()
        const op: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_2'] },
        }
        const result = flowOperations.apply(flow, op)
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches![0].steps).not.toContain('step_2')
        expect(result.steps.find(s => s.name === 'step_2')).toBeUndefined()
    })

    it('should delete multiple actions in one operation', () => {
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
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1', 'step_2'] },
        })
        expect(result.trigger.steps).toEqual([])
        expect(result.steps).toHaveLength(0)
    })

    it('should remove step from both flat array and parent refs', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        })
        expect(result.trigger.steps).toEqual([])
        expect(result.steps).toHaveLength(0)
    })

    it('should delete action between two others and keep refs consistent', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createCodeAction('step_1') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction('step_2') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_2', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction('step_3') },
        })
        // Delete middle step
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_2'] },
        })
        expect(result.trigger.steps).toEqual(['step_1', 'step_3'])
        expect(result.steps).toHaveLength(2)
        expect(result.steps.map(s => s.name)).toEqual(expect.arrayContaining(['step_1', 'step_3']))
    })

    it('should delete loop parent and keep the flow valid', () => {
        const flow = createFlowVersionWithLoop()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        })
        expect(result.trigger.steps).not.toContain('step_1')
        expect(result.steps.find(s => s.name === 'step_1')).toBeUndefined()
    })
})
