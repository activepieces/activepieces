import {
    BranchExecutionType,
    BranchOperator,
    FlowEdgeType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
} from '../../src'
import {
    createEmptyFlowVersion,
    createRouterAction,
} from './test-utils'

function getBranchEdges(flow: FlowVersion, routerId: string) {
    return flow.graph.edges
        .filter(e => e.source === routerId && e.type === FlowEdgeType.BRANCH)
        .sort((a, b) => ((a as Record<string, unknown>).branchIndex as number) - ((b as Record<string, unknown>).branchIndex as number))
}

describe('Move Branch', () => {
    function buildRouterWith3Branches(): FlowVersion {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createRouterAction('step_1') },
        })
        // Add a second condition branch at index 1 (before fallback)
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Branch 2',
                conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: 'a', secondValue: 'b', caseSensitive: false }]],
            },
        })
        return flow
    }

    it('should move branch to different position', () => {
        const flow = buildRouterWith3Branches()
        const branchesBefore = getBranchEdges(flow, 'step_1')
        const firstBranchName = (branchesBefore[0] as Record<string, unknown>).branchName
        const secondBranchName = (branchesBefore[1] as Record<string, unknown>).branchName

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: 0,
                targetBranchIndex: 1,
            },
        })
        const branchesAfter = getBranchEdges(result, 'step_1')
        expect((branchesAfter[0] as Record<string, unknown>).branchName).toBe(secondBranchName)
        expect((branchesAfter[1] as Record<string, unknown>).branchName).toBe(firstBranchName)
    })

    it('should not move FALLBACK branch (no-op)', () => {
        const flow = buildRouterWith3Branches()
        const branchesBefore = getBranchEdges(flow, 'step_1')
        const fallbackIdx = branchesBefore.findIndex(b => (b as Record<string, unknown>).branchType === BranchExecutionType.FALLBACK)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: fallbackIdx,
                targetBranchIndex: 0,
            },
        })
        const branchesAfter = getBranchEdges(result, 'step_1')
        // Fallback should remain at same index
        expect((branchesAfter[fallbackIdx] as Record<string, unknown>).branchType).toBe(BranchExecutionType.FALLBACK)
    })

    it('should treat same-index move as no-op', () => {
        const flow = buildRouterWith3Branches()
        const branchesBefore = getBranchEdges(flow, 'step_1')
        const branchNames = branchesBefore.map(b => (b as Record<string, unknown>).branchName)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: 0,
                targetBranchIndex: 0,
            },
        })
        const branchesAfter = getBranchEdges(result, 'step_1')
        expect(branchesAfter.map(b => (b as Record<string, unknown>).branchName)).toEqual(branchNames)
    })

    it('should treat out-of-bounds indices as no-op', () => {
        const flow = buildRouterWith3Branches()
        const branchesBefore = getBranchEdges(flow, 'step_1')
        const branchNames = branchesBefore.map(b => (b as Record<string, unknown>).branchName)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: 0,
                targetBranchIndex: 99,
            },
        })
        const branchesAfter = getBranchEdges(result, 'step_1')
        expect(branchesAfter.map(b => (b as Record<string, unknown>).branchName)).toEqual(branchNames)
    })
})
