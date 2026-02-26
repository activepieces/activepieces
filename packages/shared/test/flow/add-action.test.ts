import {
    FlowActionType,
    FlowOperationRequest,
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
    createFlowVersionWithSimpleAction,
    createLoopAction,
    createPieceAction,
    createRouterAction,
} from './test-utils'

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
        expect(result.trigger.steps).toEqual(['step_1'])
        expect(result.steps.find(s => s.name === 'step_1')).toBeDefined()
        expect(result.steps.find(s => s.name === 'step_1')!.type).toBe(FlowActionType.CODE)
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
        expect(result.trigger.steps).toEqual(['step_1'])
        expect(result.steps.find(s => s.name === 'step_1')!.type).toBe(FlowActionType.PIECE)
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
        expect(result.trigger.steps).toEqual(['step_1', 'step_2'])
        expect(result.steps.find(s => s.name === 'step_2')).toBeDefined()
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
        const loopStep = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(loopStep.children).toContain('step_2')
        expect(result.steps.find(s => s.name === 'step_2')).toBeDefined()
    })

    it('should add action inside router branch', () => {
        const flow = createEmptyFlowVersion()
        // Add a router with empty branches
        const router = createRouterAction('step_1')
        ;(router as RouterAction).branches![0].steps = []
        ;(router as RouterAction).branches![1].steps = []
        let result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: router,
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
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.branches![0].steps).toContain('step_2')
        expect(result.steps.find(s => s.name === 'step_2')).toBeDefined()
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
        expect(result.trigger.steps).toEqual(['step_1', 'step_3'])
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
        expect(result.trigger.steps).toEqual(['step_1', 'step_4'])
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
        expect(flow.trigger.steps).toEqual(['step_1', 'step_2', 'step_3'])
        expect(flow.steps).toHaveLength(3)
    })

    it('should include newly added action in steps array', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: createCodeAction('step_1'),
            },
        })
        expect(result.steps.map(s => s.name)).toContain('step_1')
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
