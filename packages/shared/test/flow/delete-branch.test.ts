import {
    FlowEdgeType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithRouter,
    createLoopAction,
    createRouterAction,
} from './test-utils'

function findNode(flow: FlowVersion, id: string) {
    return flow.graph.nodes.find(n => n.id === id)
}

function getBranchEdges(flow: FlowVersion, routerId: string) {
    return flow.graph.edges
        .filter(e => e.source === routerId && e.type === FlowEdgeType.BRANCH)
        .sort((a, b) => ((a as Record<string, unknown>).branchIndex as number) - ((b as Record<string, unknown>).branchIndex as number))
}

describe('Delete Branch', () => {
    it('should delete branch with steps and remove steps from graph', () => {
        const flow = createFlowVersionWithRouter()
        // Branch 0 has step_2
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        expect(branchEdges).toHaveLength(1)
        // step_2 should be removed
        expect(findNode(result, 'step_2')).toBeUndefined()
    })

    it('should delete empty branch', () => {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createRouterAction('step_1') },
        })
        // Add a third branch to have something to delete
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Extra',
            },
        })
        const countBefore = getBranchEdges(flow, 'step_1').length
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
            },
        })
        expect(getBranchEdges(result, 'step_1').length).toBe(countBefore - 1)
    })

    it('should delete branch with nested loop inside and cascade removal', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createRouterAction('step_1') },
        })
        // Add loop inside branch 0
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 0,
                action: createLoopAction('step_2'),
            },
        })
        // Add code inside loop
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_2',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
                action: createCodeAction('step_3'),
            },
        })
        // Now delete branch 0
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        // Both step_2 (loop) and step_3 (child of loop) should be removed
        expect(findNode(result, 'step_2')).toBeUndefined()
        expect(findNode(result, 'step_3')).toBeUndefined()
    })

    it('should keep remaining branches intact after deletion', () => {
        const flow = createFlowVersionWithRouter()
        // Delete branch 0 (condition branch with step_2)
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        expect(branchEdges).toHaveLength(1)
        // The fallback branch (originally at index 1) should still be intact
        expect((branchEdges[0] as Record<string, unknown>).branchName).toBe('Otherwise')
        expect(branchEdges[0].target).toBe('step_3')
        expect(findNode(result, 'step_3')).toBeDefined()
    })
})
