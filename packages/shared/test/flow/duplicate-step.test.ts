import {
    FlowActionType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    LoopOnItemsAction,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithSimpleAction,
    createLoopAction,
} from './test-utils'

describe('Duplicate Step', () => {
    it('should duplicate simple code action', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        })
        // Original still exists
        expect(result.steps.find(s => s.name === 'step_1')).toBeDefined()
        // A new step should be created with "Copy" suffix in displayName
        const duplicated = result.steps.find(s => s.name !== 'step_1' && s.type === FlowActionType.CODE)
        expect(duplicated).toBeDefined()
        expect(duplicated!.displayName).toContain('Copy')
    })

    it('should place duplicate after original in parent step list', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        })
        // trigger.steps should have step_1 followed by the new duplicated step
        expect(result.trigger.steps).toHaveLength(2)
        expect(result.trigger.steps[0]).toBe('step_1')
    })

    it('should duplicate loop with children', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createLoopAction('step_1') },
        })
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP, action: createCodeAction('step_2') },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        })
        // Original loop with child still intact
        const originalLoop = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(originalLoop.children).toContain('step_2')
        // A duplicate loop should exist
        const duplicatedLoop = result.steps.find(
            s => s.name !== 'step_1' && s.type === FlowActionType.LOOP_ON_ITEMS,
        ) as LoopOnItemsAction
        expect(duplicatedLoop).toBeDefined()
        expect(duplicatedLoop.displayName).toContain('Copy')
        // The duplicated loop should have children with new names
        expect(duplicatedLoop.children).toBeDefined()
        expect(duplicatedLoop.children!.length).toBeGreaterThan(0)
        expect(duplicatedLoop.children![0]).not.toBe('step_2')
    })

    it('should update step name references in settings during duplication', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        const codeWithRef = createCodeAction('step_1')
        codeWithRef.settings.input = { value: '{{step_1.output}}' }
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: codeWithRef },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        })
        const duplicated = result.steps.find(s => s.name !== 'step_1')
        expect(duplicated).toBeDefined()
        // The reference inside settings.input should be updated to the new step name
        const inputValue = (duplicated!.settings as { input: Record<string, string> }).input.value
        expect(inputValue).not.toContain('step_1')
        expect(inputValue).toContain(duplicated!.name)
    })
})
