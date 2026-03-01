import {
    FlowTriggerKind,
    FlowNodeType,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    PropertyExecutionType,
} from '../../src'
import {
    createFlowVersionWithSimpleAction,
    createEmptyFlowVersion,
} from './test-utils'

function getTriggerData(flow: FlowVersion) {
    const node = flow.graph.nodes.find(n => n.type === FlowNodeType.TRIGGER)
    return node?.data as Record<string, unknown> | undefined
}

describe('Update Trigger', () => {
    it('should update trigger to PIECE kind with settings', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                id: 'trigger',
                kind: FlowTriggerKind.PIECE,
                valid: true,
                displayName: 'New Trigger',
                settings: {
                    pieceName: '@activepieces/piece-github',
                    pieceVersion: '~0.3.0',
                    triggerName: 'new_star',
                    input: { repo: 'test' },
                    propertySettings: {
                        repo: { type: PropertyExecutionType.MANUAL },
                    },
                },
            },
        })
        const triggerData = getTriggerData(result)!
        expect(triggerData.kind).toBe(FlowTriggerKind.PIECE)
        expect(triggerData.displayName).toBe('New Trigger')
        expect((triggerData.settings as Record<string, unknown>).pieceName).toBe('@activepieces/piece-github')
    })

    it('should update trigger to EMPTY kind', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                id: 'trigger',
                kind: FlowTriggerKind.EMPTY,
                valid: true,
                displayName: 'Empty Trigger',
                settings: {},
            },
        })
        const triggerData = getTriggerData(result)!
        expect(triggerData.kind).toBe(FlowTriggerKind.EMPTY)
        expect(triggerData.displayName).toBe('Empty Trigger')
    })

    it('should preserve graph edges after trigger update', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                id: 'trigger',
                kind: FlowTriggerKind.PIECE,
                valid: true,
                displayName: 'Updated Trigger',
                settings: {
                    pieceName: '@activepieces/piece-github',
                    pieceVersion: '~0.3.0',
                    triggerName: 'new_star',
                    input: {},
                    propertySettings: {},
                },
            },
        })
        // Edges should be preserved
        expect(result.graph.edges.some(e => e.source === 'trigger' && e.target === 'step_1')).toBe(true)
        expect(result.graph.nodes.find(n => n.id === 'step_1')).toBeDefined()
    })

    it('should recalculate valid flag after trigger update', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                id: 'trigger',
                kind: FlowTriggerKind.EMPTY,
                valid: false,
                displayName: 'Empty',
                settings: {},
            },
        })
        expect(typeof result.valid).toBe('boolean')
    })
})
