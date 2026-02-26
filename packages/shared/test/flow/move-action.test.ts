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
    createFlowVersionWithLoop,
    createFlowVersionWithRouter,
    createLoopAction,
    createRouterAction,
} from './test-utils'

describe('Move Action', () => {
    it('should move action from trigger.steps to inside loop', () => {
        // Build: trigger → step_1 (loop, empty) → step_2 (code)
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createLoopAction('step_1') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction('step_2') },
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
        expect(result.trigger.steps).not.toContain('step_2')
        const loopStep = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(loopStep.children).toContain('step_2')
    })

    it('should move action from trigger.steps to inside router branch', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: router },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createCodeAction('step_2') },
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
        expect(result.trigger.steps).not.toContain('step_2')
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches![0].steps).toContain('step_2')
    })

    it('should move action from loop children to trigger.steps', () => {
        const flow = createFlowVersionWithLoop()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_2',
                newParentStep: 'step_1',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.AFTER,
            },
        })
        const loopStep = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(loopStep.children).not.toContain('step_2')
        expect(result.trigger.steps).toContain('step_2')
    })

    it('should verify original location no longer has the ref', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createCodeAction('step_1') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, action: createLoopAction('step_2') },
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
        // step_1 should no longer be in trigger.steps (removed by delete, then re-added inside loop)
        expect(result.trigger.steps).not.toContain('step_1')
        const loopStep = result.steps.find(s => s.name === 'step_2') as LoopOnItemsAction
        expect(loopStep.children).toContain('step_1')
    })
})
