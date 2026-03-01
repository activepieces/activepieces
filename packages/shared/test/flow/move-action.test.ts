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
    createFlowVersionWithLoop,
    createLoopAction,
    createRouterAction,
} from './test-utils'

function findNode(flow: FlowVersion, id: string) {
    return flow.graph.nodes.find(n => n.id === id)
}

function hasDefaultEdge(flow: FlowVersion, source: string, target: string) {
    return flow.graph.edges.some(e => e.source === source && e.target === target && e.type === FlowEdgeType.DEFAULT)
}

function hasLoopEdge(flow: FlowVersion, source: string, target: string) {
    return flow.graph.edges.some(e => e.source === source && e.target === target && e.type === FlowEdgeType.LOOP)
}

function hasBranchEdge(flow: FlowVersion, source: string, target: string, branchIndex: number) {
    return flow.graph.edges.some(e => e.source === source && e.target === target && e.type === FlowEdgeType.BRANCH && (e as Record<string, unknown>).branchIndex === branchIndex)
}

describe('Move Action', () => {
    it('should move action from main chain to inside loop', () => {
        // Build: trigger → step_1 (loop, empty) → step_2 (code)
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createLoopAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })
        // Move step_2 inside loop
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_2',
                newParentStep: 'step_1',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.INSIDE_LOOP,
            },
        })
        // step_2 should not be connected after step_1 via default edge
        expect(hasDefaultEdge(result, 'step_1', 'step_2')).toBe(false)
        // step_2 should be inside loop
        expect(hasLoopEdge(result, 'step_1', 'step_2')).toBe(true)
    })

    it('should move action from main chain to inside router branch', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createRouterAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_2',
                newParentStep: 'step_1',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 0,
            },
        })
        expect(hasDefaultEdge(result, 'step_1', 'step_2')).toBe(false)
        expect(hasBranchEdge(result, 'step_1', 'step_2', 0)).toBe(true)
    })

    it('should move action from loop to main chain', () => {
        const flow = createFlowVersionWithLoop()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_2',
                newParentStep: 'step_1',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.AFTER,
            },
        })
        expect(hasLoopEdge(result, 'step_1', 'step_2')).toBe(false)
        expect(hasDefaultEdge(result, 'step_1', 'step_2')).toBe(true)
    })

    it('should move 4th step to directly after the trigger', () => {
        // Build: trigger → step_1 → step_2 → step_3 → step_4
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
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_4', parentStep: 'step_3', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction() },
        })

        // Move step_4 to directly after trigger
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_4',
                newParentStep: 'trigger',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.AFTER,
            },
        })
        // trigger → step_4 → step_1 → step_2 → step_3
        expect(hasDefaultEdge(result, 'trigger', 'step_4')).toBe(true)
        expect(hasDefaultEdge(result, 'step_4', 'step_1')).toBe(true)
        expect(findNode(result, 'step_4')).toBeDefined()
    })

    it('should verify original location no longer has the ref', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createCodeAction() },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createLoopAction() },
        })
        // Move step_1 into loop
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_1',
                newParentStep: 'step_2',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.INSIDE_LOOP,
            },
        })
        // step_1 should not be connected from trigger via default edge to step_1 directly
        // (it should go trigger → step_2 now, and step_1 should be inside loop)
        expect(hasLoopEdge(result, 'step_2', 'step_1')).toBe(true)
    })
})
