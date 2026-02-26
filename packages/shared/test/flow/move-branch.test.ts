import {
    BranchExecutionType,
    BranchOperator,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    RouterAction,
} from '../../src'
import {
    createEmptyFlowVersion,
    createRouterAction,
} from './test-utils'

describe('Move Branch', () => {
    function buildRouterWith3Branches(): FlowVersion {
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
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
        const routerBefore = flow.steps.find(s => s.name === 'step_1') as RouterAction
        const firstBranchName = routerBefore.branches![0].branchName
        const secondBranchName = routerBefore.branches![1].branchName

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: 0,
                targetBranchIndex: 1,
            },
        })
        const routerAfter = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerAfter.branches![0].branchName).toBe(secondBranchName)
        expect(routerAfter.branches![1].branchName).toBe(firstBranchName)
    })

    it('should not move FALLBACK branch (no-op)', () => {
        const flow = buildRouterWith3Branches()
        const routerBefore = flow.steps.find(s => s.name === 'step_1') as RouterAction
        const fallbackIdx = routerBefore.branches!.findIndex(b => b.branchType === BranchExecutionType.FALLBACK)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: fallbackIdx,
                targetBranchIndex: 0,
            },
        })
        const routerAfter = result.steps.find(s => s.name === 'step_1') as RouterAction
        // Fallback should remain at same index
        expect(routerAfter.branches![fallbackIdx].branchType).toBe(BranchExecutionType.FALLBACK)
    })

    it('should treat same-index move as no-op', () => {
        const flow = buildRouterWith3Branches()
        const routerBefore = flow.steps.find(s => s.name === 'step_1') as RouterAction
        const branchNames = routerBefore.branches!.map(b => b.branchName)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: 0,
                targetBranchIndex: 0,
            },
        })
        const routerAfter = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerAfter.branches!.map(b => b.branchName)).toEqual(branchNames)
    })

    it('should treat out-of-bounds indices as no-op', () => {
        const flow = buildRouterWith3Branches()
        const routerBefore = flow.steps.find(s => s.name === 'step_1') as RouterAction
        const branchNames = routerBefore.branches!.map(b => b.branchName)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_BRANCH,
            request: {
                stepName: 'step_1',
                sourceBranchIndex: 0,
                targetBranchIndex: 99,
            },
        })
        const routerAfter = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerAfter.branches!.map(b => b.branchName)).toEqual(branchNames)
    })
})
