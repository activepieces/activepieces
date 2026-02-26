import {
    BranchExecutionType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    RouterAction,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createRouterAction,
} from './test-utils'

describe('Duplicate Branch', () => {
    function buildFlowWithRouterAndSteps(): FlowVersion {
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
        })
        // Add step inside branch 0
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 0,
                action: createCodeAction('step_2'),
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        // Should have 3 branches now (original condition, duplicate, fallback)
        expect(routerStep.branches!.length).toBe(3)
        // Duplicated branch should have "Copy" in name
        expect(routerStep.branches![1].branchName).toContain('Copy')
        // Duplicated branch should have steps with new names
        expect(routerStep.branches![1].steps.length).toBeGreaterThan(0)
        expect(routerStep.branches![1].steps[0]).not.toBe('step_2')
    })

    it('should duplicate empty branch', () => {
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches!.length).toBe(3)
        expect(routerStep.branches![1].branchName).toContain('Copy')
        expect(routerStep.branches![1].steps).toEqual([])
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        const duplicatedBranch = routerStep.branches![1]
        expect(duplicatedBranch.branchType).toBe(BranchExecutionType.CONDITION)
        if (duplicatedBranch.branchType === BranchExecutionType.CONDITION) {
            expect(duplicatedBranch.conditions).toBeDefined()
            expect(duplicatedBranch.conditions.length).toBeGreaterThan(0)
        }
    })
})
