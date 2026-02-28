import {
    FlowEdgeType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithLoop,
    createFlowVersionWithRouter,
    createFlowVersionWithSimpleAction,
} from './test-utils'

function findNode(flow: FlowVersion, id: string) {
    return flow.graph.nodes.find(n => n.id === id)
}

describe('Delete Action', () => {
    it('should delete single action from flow', () => {
        const flow = createFlowVersionWithSimpleAction()
        const op: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        }
        const result = flowOperations.apply(flow, op)
        expect(findNode(result, 'step_1')).toBeUndefined()
        expect(result.graph.edges.some(e => e.target === 'step_1')).toBe(false)
    })

    it('should delete action from inside loop', () => {
        const flow = createFlowVersionWithLoop()
        const op: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_2'] },
        }
        const result = flowOperations.apply(flow, op)
        expect(findNode(result, 'step_2')).toBeUndefined()
        // Loop edge should now point to null
        const loopEdge = result.graph.edges.find(e => e.source === 'step_1' && e.type === FlowEdgeType.LOOP)
        expect(loopEdge?.target).toBeNull()
    })

    it('should delete action from inside router branch', () => {
        const flow = createFlowVersionWithRouter()
        const op: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_2'] },
        }
        const result = flowOperations.apply(flow, op)
        expect(findNode(result, 'step_2')).toBeUndefined()
        // Branch edge should now point to null
        const branchEdge = result.graph.edges.find(
            e => e.source === 'step_1' && e.type === FlowEdgeType.BRANCH && (e as Record<string, unknown>).branchIndex === 0,
        )
        expect(branchEdge?.target).toBeNull()
    })

    it('should delete multiple actions in one operation', () => {
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
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1', 'step_2'] },
        })
        expect(result.graph.nodes.filter(n => n.id !== 'trigger')).toHaveLength(0)
    })

    it('should remove node and reconnect edges', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        })
        expect(findNode(result, 'step_1')).toBeUndefined()
        expect(result.graph.edges.some(e => e.source === 'trigger' && e.type === FlowEdgeType.DEFAULT)).toBe(false)
    })

    it('should delete action between two others and reconnect edges', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createCodeAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_3', parentStep: 'step_2', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })
        // Delete middle step
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_2'] },
        })
        // trigger → step_1 → step_3
        expect(result.graph.edges.some(e => e.source === 'trigger' && e.target === 'step_1' && e.type === FlowEdgeType.DEFAULT)).toBe(true)
        expect(result.graph.edges.some(e => e.source === 'step_1' && e.target === 'step_3' && e.type === FlowEdgeType.DEFAULT)).toBe(true)
        expect(result.graph.nodes.filter(n => n.id !== 'trigger')).toHaveLength(2)
    })

    it('should delete loop parent and keep the flow valid', () => {
        const flow = createFlowVersionWithLoop()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        })
        expect(findNode(result, 'step_1')).toBeUndefined()
    })
})
