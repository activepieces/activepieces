import {
    BranchExecutionType,
    FlowActionKind,
    FlowEdgeType,
    FlowNodeType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    RouterExecutionType,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithLoop,
    createFlowVersionWithRouter,
    createFlowVersionWithSimpleAction,
    createLoopAction,
    createPieceAction,
    createRouterAction,
} from './test-utils'

function findNode(flow: FlowVersion, id: string) {
    return flow.graph.nodes.find(n => n.id === id)
}

function getNodeData(flow: FlowVersion, id: string) {
    return findNode(flow, id)?.data as Record<string, unknown> | undefined
}

function hasDefaultEdge(flow: FlowVersion, source: string, target: string) {
    return flow.graph.edges.some(e => e.source === source && e.target === target && e.type === FlowEdgeType.DEFAULT)
}

function hasBranchEdge(flow: FlowVersion, source: string, target: string | null, branchIndex: number) {
    return flow.graph.edges.some(e => e.source === source && e.target === target && e.type === FlowEdgeType.BRANCH && (e as Record<string, unknown>).branchIndex === branchIndex)
}

function hasLoopEdge(flow: FlowVersion, source: string, target: string | null) {
    return flow.graph.edges.some(e => e.source === source && e.target === target && e.type === FlowEdgeType.LOOP)
}

describe('Add Action', () => {
    it('should add code action after trigger on empty flow', () => {
        const flow = createEmptyFlowVersion()
        const op: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createCodeAction('step_1'),
            },
        }
        const result = flowOperations.apply(flow, op)
        expect(findNode(result, 'step_1')).toBeDefined()
        expect(getNodeData(result, 'step_1')!.kind).toBe(FlowActionKind.CODE)
        expect(hasDefaultEdge(result, 'trigger', 'step_1')).toBe(true)
    })

    it('should add piece action after trigger on empty flow', () => {
        const flow = createEmptyFlowVersion()
        const op: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createPieceAction('step_1'),
            },
        }
        const result = flowOperations.apply(flow, op)
        expect(hasDefaultEdge(result, 'trigger', 'step_1')).toBe(true)
        expect(getNodeData(result, 'step_1')!.kind).toBe(FlowActionKind.PIECE)
    })

    it('should add action after existing action', () => {
        const flow = createFlowVersionWithSimpleAction()
        const op: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: createCodeAction('step_2'),
            },
        }
        const result = flowOperations.apply(flow, op)
        expect(hasDefaultEdge(result, 'trigger', 'step_1')).toBe(true)
        expect(hasDefaultEdge(result, 'step_1', 'step_2')).toBe(true)
        expect(findNode(result, 'step_2')).toBeDefined()
    })

    it('should add action inside loop', () => {
        const flow = createEmptyFlowVersion()
        // First add loop
        let result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createLoopAction('step_1'),
            },
        })
        // Then add inside loop
        result = flowOperations.apply(result, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
                action: createCodeAction('step_2'),
            },
        })
        expect(hasLoopEdge(result, 'step_1', 'step_2')).toBe(true)
        expect(findNode(result, 'step_2')).toBeDefined()
    })

    it('should add action inside router branch', () => {
        const flow = createEmptyFlowVersion()
        // Add a router
        let result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createRouterAction('step_1'),
            },
        })
        // Add inside branch 0
        result = flowOperations.apply(result, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 0,
                action: createCodeAction('step_2'),
            },
        })
        expect(hasBranchEdge(result, 'step_1', 'step_2', 0)).toBe(true)
        expect(findNode(result, 'step_2')).toBeDefined()
    })

    it('should add branch to router then add action inside the new branch', () => {
        const flow = createEmptyFlowVersion()
        // Add a router
        let result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createRouterAction('step_1'),
            },
        })
        // Add a new branch at index 1
        result = flowOperations.apply(result, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Branch 2',
            },
        })
        // Add action inside the new branch (index 1)
        result = flowOperations.apply(result, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 1,
                action: createCodeAction('step_2'),
            },
        })
        const branchEdges = result.graph.edges.filter(e => e.source === 'step_1' && e.type === FlowEdgeType.BRANCH)
        expect(branchEdges).toHaveLength(3)
        const branch1Edge = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)
        expect(branch1Edge).toBeDefined()
        expect((branch1Edge as Record<string, unknown>).branchName).toBe('Branch 2')
        expect(branch1Edge!.target).toBe('step_2')
        expect(findNode(result, 'step_2')).toBeDefined()
    })

    it('should add action after loop step', () => {
        const flow = createFlowVersionWithLoop()
        const op: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: createCodeAction('step_3'),
            },
        }
        const result = flowOperations.apply(flow, op)
        expect(hasDefaultEdge(result, 'step_1', 'step_3')).toBe(true)
    })

    it('should add action after router step', () => {
        const flow = createFlowVersionWithRouter()
        const op: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: createCodeAction('step_4'),
            },
        }
        const result = flowOperations.apply(flow, op)
        expect(hasDefaultEdge(result, 'step_1', 'step_4')).toBe(true)
    })

    it('should add multiple actions sequentially', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createCodeAction('step_1'),
            },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: createCodeAction('step_2'),
            },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_2',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: createPieceAction('step_3'),
            },
        })
        expect(hasDefaultEdge(flow, 'trigger', 'step_1')).toBe(true)
        expect(hasDefaultEdge(flow, 'step_1', 'step_2')).toBe(true)
        expect(hasDefaultEdge(flow, 'step_2', 'step_3')).toBe(true)
        // 4 nodes: trigger + 3 actions
        expect(flow.graph.nodes).toHaveLength(4)
    })

    it('should include newly added action in graph nodes', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createCodeAction('step_1'),
            },
        })
        expect(result.graph.nodes.map(n => n.id)).toContain('step_1')
    })

    it('should create router with default branches when branches are empty', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    displayName: 'Router',
                    kind: FlowActionKind.ROUTER,
                    valid: false,
                    settings: {
                        executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                    },
                },
            },
        })
        const branchEdges = result.graph.edges.filter(e => e.source === 'step_1' && e.type === FlowEdgeType.BRANCH)
        expect(branchEdges).toHaveLength(2)
        const branch0 = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 0)!
        const branch1 = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect((branch0 as Record<string, unknown>).branchType).toBe(BranchExecutionType.CONDITION)
        expect((branch0 as Record<string, unknown>).branchName).toBe('Branch 1')
        expect(branch0.target).toBeNull()
        expect((branch1 as Record<string, unknown>).branchType).toBe(BranchExecutionType.FALLBACK)
        expect((branch1 as Record<string, unknown>).branchName).toBe('Otherwise')
        expect(branch1.target).toBeNull()
    })

    it('should recalculate valid flag after adding action', () => {
        const flow = createEmptyFlowVersion()
        const invalidAction = createCodeAction('step_1')
        invalidAction.valid = false
        // Remove required sourceCode to make it actually invalid
        invalidAction.settings = { input: {} } as typeof invalidAction.settings
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: invalidAction,
            },
        })
        expect(result.valid).toBe(false)
    })
})
