import {
    BranchExecutionType,
    FlowEdgeType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createRouterAction,
} from './test-utils'

function getBranchEdges(flow: FlowVersion, routerId: string) {
    return flow.graph.edges
        .filter(e => e.source === routerId && e.type === FlowEdgeType.BRANCH)
        .sort((a, b) => ((a as Record<string, unknown>).branchIndex as number) - ((b as Record<string, unknown>).branchIndex as number))
}

describe('Duplicate Branch', () => {
    function buildFlowWithRouterAndSteps(): FlowVersion {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createRouterAction() },
        })
        // Add step inside branch 0
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                id: 'step_2',
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 0,
                action: createCodeAction(),
            },
        })
        return flow
    }

    it('should duplicate branch with steps', () => {
        const flow = buildFlowWithRouterAndSteps()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        // Should have 3 branches now (original condition, duplicate, fallback)
        expect(branchEdges.length).toBe(3)
        // Duplicated branch should have "Copy" in name
        const dupBranch = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect((dupBranch as Record<string, unknown>).branchName).toContain('Copy')
        // Duplicated branch should have a target (new step)
        expect(dupBranch.target).toBeDefined()
        expect(dupBranch.target).not.toBe('step_2')
    })

    it('should duplicate empty branch', () => {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createRouterAction() },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        expect(branchEdges.length).toBe(3)
        const dupBranch = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect((dupBranch as Record<string, unknown>).branchName).toContain('Copy')
        // Empty branch has null target
        expect(dupBranch.target).toBeNull()
    })

    it('should duplicate branch with conditions', () => {
        const flow = buildFlowWithRouterAndSteps()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const branchEdges = getBranchEdges(result, 'step_1')
        const dupBranch = branchEdges.find(e => (e as Record<string, unknown>).branchIndex === 1)!
        expect((dupBranch as Record<string, unknown>).branchType).toBe(BranchExecutionType.CONDITION)
        expect((dupBranch as Record<string, unknown>).conditions).toBeDefined()
    })
})
