import {
    BranchExecutionType,
    BranchOperator,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    RouterAction,
} from '../../src'
import {
    createEmptyFlowVersion,
    createRouterAction,
} from './test-utils'

describe('Add Branch', () => {
    function buildFlowWithRouter() {
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
        })
        return flow
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches).toHaveLength(3)
        expect(routerStep.branches![1].branchName).toBe('New Branch')
        expect(routerStep.branches![1].branchType).toBe(BranchExecutionType.CONDITION)
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches![0].branchName).toBe('First Branch')
        expect(routerStep.branches).toHaveLength(3)
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        const newBranch = routerStep.branches![1]
        expect(newBranch.branchType).toBe(BranchExecutionType.CONDITION)
        expect(newBranch.branchName).toBe('Default Branch')
        // Should have default empty conditions
        if (newBranch.branchType === BranchExecutionType.CONDITION) {
            expect(newBranch.conditions).toBeDefined()
            expect(newBranch.conditions.length).toBeGreaterThan(0)
        }
    })

    it('should grow router branches array by 1', () => {
        const flow = buildFlowWithRouter()
        const routerBefore = flow.steps.find(s => s.name === 'step_1') as RouterAction
        const countBefore = routerBefore.branches!.length
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Extra',
            },
        })
        const routerAfter = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerAfter.branches!.length).toBe(countBefore + 1)
    })

    it('should create new branch with empty steps array', () => {
        const flow = buildFlowWithRouter()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
                branchName: 'Empty Branch',
            },
        })
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches![1].steps).toEqual([])
    })
})
