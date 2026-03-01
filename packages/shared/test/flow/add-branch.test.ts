import {
    BranchExecutionType,
    BranchOperator,
    FlowEdgeType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
} from '../../src'
import {
    createEmptyFlowVersion,
    createRouterAction,
} from './test-utils'

describe('Add Branch', () => {
    function buildFlowWithRouter() {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createRouterAction() },
        })
        return flow
    }

    function getBranchEdges(flow: FlowVersion, routerId: string) {
        return flow.graph.edges
            .filter(e => e.source === routerId && e.type === FlowEdgeType.BRANCH)
            .sort((a, b) => ((a as Record<string, unknown>).branchIndex as number) - ((b as Record<string, unknown>).branchIndex as number))
    }

    it('should add condition branch to router with conditions', () => {
        const flow = buildFlowWithRouter()
        const op: FlowOperationRequest = {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'New Branch',
                conditions: [
                    [
                        {
                            operator: BranchOperator.TEXT_CONTAINS,
                            firstValue: '{{trigger.data}}',
                            secondValue: 'hello',
                            caseSensitive: false,
                        },
                    ],
                ],
            },
        }
        const result = flowOperations.apply(flow, op)
        const branchEdges = getBranchEdges(result, 'step_1')
        expect(branchEdges).toHaveLength(3)
        const newBranch = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect((newBranch as Record<string, unknown>).branchName).toBe('New Branch')
        expect((newBranch as Record<string, unknown>).branchType).toBe(BranchExecutionType.CONDITION)
    })

    it('should add branch at specific index', () => {
        const flow = buildFlowWithRouter()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
                branchName: 'First Branch',
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        expect((branchEdges[0] as Record<string, unknown>).branchName).toBe('First Branch')
        expect(branchEdges).toHaveLength(3)
    })

    it('should add branch without conditions (defaults to empty condition)', () => {
        const flow = buildFlowWithRouter()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Default Branch',
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        const newBranch = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect((newBranch as Record<string, unknown>).branchType).toBe(BranchExecutionType.CONDITION)
        expect((newBranch as Record<string, unknown>).branchName).toBe('Default Branch')
        expect((newBranch as Record<string, unknown>).conditions).toBeDefined()
    })

    it('should grow router branch edges count by 1', () => {
        const flow = buildFlowWithRouter()
        const countBefore = getBranchEdges(flow, 'step_1').length
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Extra',
            },
        })
        expect(getBranchEdges(result, 'step_1').length).toBe(countBefore + 1)
    })

    it('should create new branch edge with null target', () => {
        const flow = buildFlowWithRouter()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Empty Branch',
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        const newBranch = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect(newBranch.target).toBeNull()
    })
})
