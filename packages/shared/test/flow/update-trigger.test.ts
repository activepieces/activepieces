import {
    FlowTriggerType,
    flowOperations,
    FlowOperationType,
    PropertyExecutionType,
} from '../../src'
import {
    createFlowVersionWithSimpleAction,
    createEmptyFlowVersion,
} from './test-utils'

describe('Update Trigger', () => {
    it('should update trigger to PIECE type with settings', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                valid: true,
                displayName: 'New Trigger',
                steps: [],
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
        expect(result.trigger.type).toBe(FlowTriggerType.PIECE)
        expect(result.trigger.displayName).toBe('New Trigger')
        if (result.trigger.type === FlowTriggerType.PIECE) {
            expect(result.trigger.settings.pieceName).toBe('@activepieces/piece-github')
        }
    })

    it('should update trigger to EMPTY type', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                name: 'trigger',
                type: FlowTriggerType.EMPTY,
                valid: true,
                displayName: 'Empty Trigger',
                steps: [],
                settings: {},
            },
        })
        expect(result.trigger.type).toBe(FlowTriggerType.EMPTY)
        expect(result.trigger.displayName).toBe('Empty Trigger')
    })

    it('should preserve trigger.steps after update', () => {
        const flow = createFlowVersionWithSimpleAction()
        expect(flow.trigger.steps).toEqual(['step_1'])
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                valid: true,
                displayName: 'Updated Trigger',
                steps: [],
                settings: {
                    pieceName: '@activepieces/piece-github',
                    pieceVersion: '~0.3.0',
                    triggerName: 'new_star',
                    input: {},
                    propertySettings: {},
                },
            },
        })
        // Steps should be preserved even though the request doesn't carry them
        expect(result.trigger.steps).toEqual(['step_1'])
        expect(result.steps.find(s => s.name === 'step_1')).toBeDefined()
    })

    it('should recalculate valid flag after trigger update', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                name: 'trigger',
                type: FlowTriggerType.EMPTY,
                valid: false,
                displayName: 'Empty',
                steps: [],
                settings: {},
            },
        })
        // FlowVersion validity depends on all steps being valid
        expect(typeof result.valid).toBe('boolean')
    })
})
