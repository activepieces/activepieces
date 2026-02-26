import {
    BranchExecutionType,
    BranchOperator,
    FlowActionType,
    flowOperations,
    FlowOperationType,
    FlowTriggerType,
    FlowVersion,
    LoopOnItemsAction,
    PropertyExecutionType,
    RouterAction,
    RouterExecutionType,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
} from './test-utils'

describe('Import Flow', () => {
    it('should import flow into empty flow with trigger and steps', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Imported Flow',
                trigger: {
                    name: 'trigger',
                    type: FlowTriggerType.PIECE,
                    valid: true,
                    displayName: 'Webhook',
                    steps: ['step_1'],
                    settings: {
                        pieceName: '@activepieces/piece-webhook',
                        pieceVersion: '~0.1.0',
                        triggerName: 'catch_webhook',
                        input: {},
                        propertySettings: {},
                    },
                },
                steps: [
                    {
                        name: 'step_1',
                        type: FlowActionType.CODE,
                        valid: true,
                        displayName: 'Code',
                        settings: {
                            sourceCode: { code: 'test', packageJson: '{}' },
                            input: {},
                        },
                    },
                ],
                schemaVersion: null,
                notes: null,
            },
        })
        expect(result.displayName).toBe('Imported Flow')
        expect(result.trigger.steps).toContain('step_1')
        expect(result.steps.find(s => s.name === 'step_1')).toBeDefined()
    })

    it('should import flow with loop and reconstruct children', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Flow with Loop',
                trigger: {
                    name: 'trigger',
                    type: FlowTriggerType.PIECE,
                    valid: true,
                    displayName: 'Schedule',
                    steps: ['step_1'],
                    settings: {
                        pieceName: 'schedule',
                        pieceVersion: '0.0.1',
                        triggerName: 'every_hour',
                        input: {},
                        propertySettings: {},
                    },
                },
                steps: [
                    {
                        name: 'step_1',
                        type: FlowActionType.LOOP_ON_ITEMS,
                        valid: true,
                        displayName: 'Loop',
                        settings: { items: '{{trigger.items}}' },
                        children: ['step_2'],
                    },
                    {
                        name: 'step_2',
                        type: FlowActionType.CODE,
                        valid: true,
                        displayName: 'Code in Loop',
                        settings: {
                            sourceCode: { code: 'test', packageJson: '{}' },
                            input: {},
                        },
                    },
                ],
                schemaVersion: null,
                notes: null,
            },
        })
        const loopStep = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(loopStep).toBeDefined()
        expect(loopStep.children).toContain('step_2')
        expect(result.steps.find(s => s.name === 'step_2')).toBeDefined()
    })

    it('should import flow with router and reconstruct branches', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Flow with Router',
                trigger: {
                    name: 'trigger',
                    type: FlowTriggerType.PIECE,
                    valid: true,
                    displayName: 'Schedule',
                    steps: ['step_1'],
                    settings: {
                        pieceName: 'schedule',
                        pieceVersion: '0.0.1',
                        triggerName: 'every_hour',
                        input: {},
                        propertySettings: {},
                    },
                },
                steps: [
                    {
                        name: 'step_1',
                        type: FlowActionType.ROUTER,
                        valid: true,
                        displayName: 'Router',
                        settings: { executionType: RouterExecutionType.EXECUTE_FIRST_MATCH },
                        branches: [
                            {
                                branchType: BranchExecutionType.CONDITION,
                                branchName: 'Condition 1',
                                conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: 'a', secondValue: 'b', caseSensitive: false }]],
                                steps: ['step_2'],
                            },
                            {
                                branchType: BranchExecutionType.FALLBACK,
                                branchName: 'Otherwise',
                                steps: ['step_3'],
                            },
                        ],
                    },
                    {
                        name: 'step_2',
                        type: FlowActionType.CODE,
                        valid: true,
                        displayName: 'Branch 1 Code',
                        settings: { sourceCode: { code: 'test', packageJson: '{}' }, input: {} },
                    },
                    {
                        name: 'step_3',
                        type: FlowActionType.CODE,
                        valid: true,
                        displayName: 'Fallback Code',
                        settings: { sourceCode: { code: 'test2', packageJson: '{}' }, input: {} },
                    },
                ],
                schemaVersion: null,
                notes: null,
            },
        })
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep).toBeDefined()
        expect(routerStep.branches).toHaveLength(2)
        expect(routerStep.branches![0].steps).toContain('step_2')
        expect(routerStep.branches![1].steps).toContain('step_3')
    })

    it('should replace existing steps on import', () => {
        // Start with a flow that has step_1
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { parentStep: 'trigger', action: createCodeAction('step_1') },
        })
        expect(flow.steps.find(s => s.name === 'step_1')).toBeDefined()

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Replaced Flow',
                trigger: {
                    name: 'trigger',
                    type: FlowTriggerType.PIECE,
                    valid: true,
                    displayName: 'New Trigger',
                    steps: ['step_1'],
                    settings: {
                        pieceName: 'schedule',
                        pieceVersion: '0.0.1',
                        triggerName: 'every_hour',
                        input: {},
                        propertySettings: {},
                    },
                },
                steps: [
                    {
                        name: 'step_1',
                        type: FlowActionType.CODE,
                        valid: true,
                        displayName: 'New Code',
                        settings: { sourceCode: { code: 'new code', packageJson: '{}' }, input: {} },
                    },
                ],
                schemaVersion: null,
                notes: null,
            },
        })
        expect(result.displayName).toBe('Replaced Flow')
        expect(result.steps.find(s => s.name === 'step_1')!.displayName).toBe('New Code')
    })

    it('should import with notes (delete old, add new)', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        // Add an existing note
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_NOTE,
            request: {
                id: 'note-1',
                content: 'Old Note',
                color: 'orange',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
            },
        })
        expect(flow.notes).toHaveLength(1)

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Flow with Notes',
                trigger: {
                    name: 'trigger',
                    type: FlowTriggerType.PIECE,
                    valid: true,
                    displayName: 'Schedule',
                    steps: [],
                    settings: {
                        pieceName: 'schedule',
                        pieceVersion: '0.0.1',
                        triggerName: 'every_hour',
                        input: {},
                        propertySettings: {},
                    },
                },
                steps: [],
                schemaVersion: null,
                notes: [
                    {
                        id: 'note-2',
                        content: 'New Note',
                        ownerId: null,
                        color: 'blue',
                        position: { x: 50, y: 50 },
                        size: { width: 200, height: 200 },
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z',
                    },
                ],
            },
        })
        // Old note should be gone, new note should be present
        expect(result.notes.find(n => n.id === 'note-1')).toBeUndefined()
        expect(result.notes.find(n => n.id === 'note-2')).toBeDefined()
        expect(result.notes.find(n => n.id === 'note-2')!.content).toBe('New Note')
    })
})
