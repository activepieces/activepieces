import {
    FlowActionType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    LoopOnItemsAction,
    RouterAction,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithRouter,
    createLoopAction,
    createRouterAction,
} from './test-utils'

describe('Delete Branch', () => {
    it('should delete branch with steps and remove steps from flat array', () => {
        const flow = createFlowVersionWithRouter()
        // Branch 0 has step_2
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 0,
            },
        })
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches).toHaveLength(1)
        // step_2 should be removed from the steps array
        expect(result.steps.find(s => s.name === 'step_2')).toBeUndefined()
    })

    it('should delete empty branch', () => {
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
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
        const beforeRouter = flow.steps.find(s => s.name === 'step_1') as RouterAction
        const countBefore = beforeRouter.branches!.length
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_BRANCH,
            request: {
                stepName: 'step_1',
                branchIndex: 1,
            },
        })
        const afterRouter = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(afterRouter.branches!.length).toBe(countBefore - 1)
    })

    it('should delete branch with nested loop inside and cascade removal', () => {
        // Build router with a loop inside branch 0
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
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
        expect(result.steps.find(s => s.name === 'step_2')).toBeUndefined()
        expect(result.steps.find(s => s.name === 'step_3')).toBeUndefined()
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches).toHaveLength(1)
        // The fallback branch (originally at index 1) should still be intact
        expect(routerStep.branches![0].branchName).toBe('Otherwise')
        expect(routerStep.branches![0].steps).toContain('step_3')
        expect(result.steps.find(s => s.name === 'step_3')).toBeDefined()
    })
})
