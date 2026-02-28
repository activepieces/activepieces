import {
    FlowActionKind,
    FlowEdgeType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createFlowVersionWithSimpleAction,
    createLoopAction,
} from './test-utils'

function findNode(flow: FlowVersion, id: string) {
    return flow.graph.nodes.find(n => n.id === id)
}

function getNodeData(flow: FlowVersion, id: string) {
    return findNode(flow, id)?.data as Record<string, unknown> | undefined
}

describe('Duplicate Step', () => {
    it('should duplicate simple code action', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        })
        // Original still exists
        expect(findNode(result, 'step_1')).toBeDefined()
        // A new node should be created with "Copy" suffix in displayName
        const actionNodes = result.graph.nodes.filter(n => {
            const data = n.data as Record<string, unknown>
            return n.id !== 'step_1' && n.id !== 'trigger' && data.kind === FlowActionKind.CODE
        })
        expect(actionNodes).toHaveLength(1)
        expect((actionNodes[0].data as Record<string, unknown>).displayName).toContain('Copy')
    })

    it('should place duplicate after original via default edge', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        })
        // trigger → step_1 → duplicated
        const step1DefaultEdge = result.graph.edges.find(e => e.source === 'step_1' && e.type === FlowEdgeType.DEFAULT)
        expect(step1DefaultEdge).toBeDefined()
        const duplicatedId = step1DefaultEdge!.target
        expect(findNode(result, duplicatedId)).toBeDefined()
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
        // Original loop still has loop edge to step_2
        const origLoopEdge = result.graph.edges.find(e => e.source === 'step_1' && e.type === FlowEdgeType.LOOP)
        expect(origLoopEdge).toBeDefined()
        expect(origLoopEdge!.target).toBe('step_2')
        // A duplicated loop should exist after step_1
        const step1DefaultEdge = result.graph.edges.find(e => e.source === 'step_1' && e.type === FlowEdgeType.DEFAULT)
        expect(step1DefaultEdge).toBeDefined()
        const dupLoopId = step1DefaultEdge!.target
        const dupLoopData = getNodeData(result, dupLoopId)!
        expect(dupLoopData.kind).toBe(FlowActionKind.LOOP_ON_ITEMS)
        expect(dupLoopData.displayName).toContain('Copy')
        // The duplicated loop should have a loop edge to a new child
        const dupLoopEdge = result.graph.edges.find(e => e.source === dupLoopId && e.type === FlowEdgeType.LOOP)
        expect(dupLoopEdge).toBeDefined()
        expect(dupLoopEdge!.target).not.toBe('step_2')
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
        const duplicated = result.graph.nodes.find(n => n.id !== 'step_1' && n.id !== 'trigger')
        expect(duplicated).toBeDefined()
        const data = duplicated!.data as Record<string, unknown>
        const settings = data.settings as Record<string, unknown>
        const input = settings.input as Record<string, string>
        expect(input.value).not.toContain('step_1')
        expect(input.value).toContain(duplicated!.id)
    })
})
