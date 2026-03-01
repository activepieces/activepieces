import {
    BranchEdge,
    BranchExecutionType,
    BranchOperator,
    FlowActionKind,
    FlowEdgeType,
    FlowNodeType,
    flowOperations,
    FlowOperationType,
    FlowTriggerKind,
    FlowVersion,
    RouterExecutionType,
    StepLocationRelativeToParent,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
} from './test-utils'

function findNode(flow: FlowVersion, id: string) {
    return flow.graph.nodes.find(n => n.id === id)
}

function getNodeData(flow: FlowVersion, id: string) {
    return findNode(flow, id)?.data as Record<string, unknown> | undefined
}

describe('Import Flow', () => {
    it('should import flow into empty flow with trigger and steps', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Imported Flow',
                graph: {
                    nodes: [
                        {
                            id: 'trigger',
                            type: FlowNodeType.TRIGGER,
                            data: {
                                kind: FlowTriggerKind.PIECE,
                                valid: true,
                                displayName: 'Webhook',
                                settings: {
                                    pieceName: '@activepieces/piece-webhook',
                                    pieceVersion: '~0.1.0',
                                    triggerName: 'catch_webhook',
                                    input: {},
                                    propertySettings: {},
                                },
                            },
                        },
                        {
                            id: 'step_1',
                            type: FlowNodeType.ACTION,
                            data: {
                                kind: FlowActionKind.CODE,
                                valid: true,
                                displayName: 'Code',
                                settings: {
                                    sourceCode: { code: 'test', packageJson: '{}' },
                                    input: {},
                                },
                            },
                        },
                    ],
                    edges: [
                        {
                            id: 'trigger-default',
                            source: 'trigger',
                            target: 'step_1',
                            type: FlowEdgeType.DEFAULT,
                        },
                    ],
                },
                schemaVersion: null,
                notes: null,
            },
        })
        expect(result.displayName).toBe('Imported Flow')
        expect(findNode(result, 'step_1')).toBeDefined()
        expect(result.graph.edges.some(e => e.source === 'trigger' && e.target === 'step_1')).toBe(true)
    })

    it('should import flow with loop and reconstruct edges', () => {
        const flow = createEmptyFlowVersion()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Flow with Loop',
                graph: {
                    nodes: [
                        {
                            id: 'trigger',
                            type: FlowNodeType.TRIGGER,
                            data: {
                                kind: FlowTriggerKind.PIECE,
                                valid: true,
                                displayName: 'Schedule',
                                settings: {
                                    pieceName: 'schedule',
                                    pieceVersion: '0.0.1',
                                    triggerName: 'every_hour',
                                    input: {},
                                    propertySettings: {},
                                },
                            },
                        },
                        {
                            id: 'step_1',
                            type: FlowNodeType.ACTION,
                            data: {
                                kind: FlowActionKind.LOOP_ON_ITEMS,
                                valid: true,
                                displayName: 'Loop',
                                settings: { items: '{{trigger.items}}' },
                            },
                        },
                        {
                            id: 'step_2',
                            type: FlowNodeType.ACTION,
                            data: {
                                kind: FlowActionKind.CODE,
                                valid: true,
                                displayName: 'Code in Loop',
                                settings: {
                                    sourceCode: { code: 'test', packageJson: '{}' },
                                    input: {},
                                },
                            },
                        },
                    ],
                    edges: [
                        { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                        { id: 'step_1-loop', source: 'step_1', target: 'step_2', type: FlowEdgeType.LOOP },
                    ],
                },
                schemaVersion: null,
                notes: null,
            },
        })
        expect(findNode(result, 'step_1')).toBeDefined()
        expect(findNode(result, 'step_2')).toBeDefined()
        // Loop edge should exist
        expect(result.graph.edges.some(e => e.source === 'step_1' && e.type === FlowEdgeType.LOOP)).toBe(true)
    })

    it('should replace existing steps on import', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: { id: 'step_1', parentStep: 'trigger', action: createCodeAction() },
        })
        expect(findNode(flow, 'step_1')).toBeDefined()

        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Replaced Flow',
                graph: {
                    nodes: [
                        {
                            id: 'trigger',
                            type: FlowNodeType.TRIGGER,
                            data: {
                                kind: FlowTriggerKind.PIECE,
                                valid: true,
                                displayName: 'New Trigger',
                                settings: {
                                    pieceName: 'schedule',
                                    pieceVersion: '0.0.1',
                                    triggerName: 'every_hour',
                                    input: {},
                                    propertySettings: {},
                                },
                            },
                        },
                        {
                            id: 'step_1',
                            type: FlowNodeType.ACTION,
                            data: {
                                kind: FlowActionKind.CODE,
                                valid: true,
                                displayName: 'New Code',
                                settings: { sourceCode: { code: 'new code', packageJson: '{}' }, input: {} },
                            },
                        },
                    ],
                    edges: [
                        { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                    ],
                },
                schemaVersion: null,
                notes: null,
            },
        })
        expect(result.displayName).toBe('Replaced Flow')
        expect(getNodeData(result, 'step_1')!.displayName).toBe('New Code')
    })

    it('should import flow with router and preserve branch conditions', () => {
        const flow = createEmptyFlowVersion()
        const conditions = [
            [
                { operator: BranchOperator.BOOLEAN_IS_FALSE, firstValue: '{{step_1.free_email}}' },
                { operator: BranchOperator.EXISTS, firstValue: '{{step_1.domain}}' },
            ],
        ]
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: 'Flow with Router',
                graph: {
                    nodes: [
                        {
                            id: 'trigger',
                            type: FlowNodeType.TRIGGER,
                            data: {
                                kind: FlowTriggerKind.PIECE,
                                valid: true,
                                displayName: 'Webhook',
                                settings: {
                                    pieceName: '@activepieces/piece-webhook',
                                    pieceVersion: '~0.1.0',
                                    triggerName: 'catch_webhook',
                                    input: {},
                                    propertySettings: {},
                                },
                            },
                        },
                        {
                            id: 'router_1',
                            type: FlowNodeType.ACTION,
                            data: {
                                kind: FlowActionKind.ROUTER,
                                valid: true,
                                displayName: 'Not free email?',
                                settings: {
                                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                                },
                            },
                        },
                        {
                            id: 'step_a',
                            type: FlowNodeType.ACTION,
                            data: {
                                kind: FlowActionKind.CODE,
                                valid: true,
                                displayName: 'Branch A Step',
                                settings: {
                                    sourceCode: { code: 'test', packageJson: '{}' },
                                    input: {},
                                },
                            },
                        },
                    ],
                    edges: [
                        { id: 'trigger-default', source: 'trigger', target: 'router_1', type: FlowEdgeType.DEFAULT },
                        {
                            id: 'router_1-branch-0',
                            source: 'router_1',
                            target: 'step_a',
                            type: FlowEdgeType.BRANCH,
                            branchIndex: 0,
                            branchName: 'Has Domain',
                            branchType: BranchExecutionType.CONDITION,
                            conditions,
                        },
                        {
                            id: 'router_1-branch-1',
                            source: 'router_1',
                            target: null,
                            type: FlowEdgeType.BRANCH,
                            branchIndex: 1,
                            branchName: 'Otherwise',
                            branchType: BranchExecutionType.FALLBACK,
                        },
                    ],
                },
                schemaVersion: null,
                notes: null,
            },
        })

        expect(findNode(result, 'router_1')).toBeDefined()
        expect(findNode(result, 'step_a')).toBeDefined()

        // Check branch edges have correct conditions
        const branchEdges = result.graph.edges
            .filter((e): e is BranchEdge => e.type === FlowEdgeType.BRANCH && e.source === 'router_1')
            .sort((a, b) => a.branchIndex - b.branchIndex)

        expect(branchEdges).toHaveLength(2)
        expect(branchEdges[0]).toMatchObject({
            branchIndex: 0,
            branchName: 'Has Domain',
            branchType: BranchExecutionType.CONDITION,
        })
        expect(branchEdges[0].conditions).toEqual(conditions)

        expect(branchEdges[1]).toMatchObject({
            branchIndex: 1,
            branchName: 'Otherwise',
            branchType: BranchExecutionType.FALLBACK,
        })
    })

    it('should import with notes (delete old, add new)', () => {
        let flow: FlowVersion = createEmptyFlowVersion()
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
                graph: {
                    nodes: [
                        {
                            id: 'trigger',
                            type: FlowNodeType.TRIGGER,
                            data: {
                                kind: FlowTriggerKind.PIECE,
                                valid: true,
                                displayName: 'Schedule',
                                settings: {
                                    pieceName: 'schedule',
                                    pieceVersion: '0.0.1',
                                    triggerName: 'every_hour',
                                    input: {},
                                    propertySettings: {},
                                },
                            },
                        },
                    ],
                    edges: [],
                },
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
        expect(result.notes.find(n => n.id === 'note-1')).toBeUndefined()
        expect(result.notes.find(n => n.id === 'note-2')).toBeDefined()
        expect(result.notes.find(n => n.id === 'note-2')!.content).toBe('New Note')
    })
})
