import {
    BranchExecutionType,
    BranchOperator,
    FlowActionKind,
    FlowEdgeType,
    FlowGraphNode,
    FlowNodeType,
    FlowTriggerKind,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    RouterExecutionType,
    UpdateActionRequest,
} from '../../src'

export function createEmptyFlowVersion(): FlowVersion {
    return {
        id: 'test-version-id',
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
        flowId: 'test-flow-id',
        updatedBy: '',
        displayName: 'Test Flow',
        agentIds: [],
        notes: [],
        graph: {
            nodes: [
                {
                    id: 'trigger',
                    type: FlowNodeType.TRIGGER,
                    data: {
                        name: 'trigger',
                        kind: FlowTriggerKind.PIECE,
                        valid: true,
                        settings: {
                            input: {},
                            pieceName: 'schedule',
                            pieceVersion: '0.0.1',
                            propertySettings: {},
                            triggerName: 'every_hour',
                        },
                        displayName: 'Schedule',
                    },
                },
            ],
            edges: [],
        },
        connectionIds: [],
        valid: true,
        state: FlowVersionState.DRAFT,
    }
}

export function createFlowVersionWithSimpleAction(): FlowVersion {
    const flow = createEmptyFlowVersion()
    flow.graph.nodes.push(createCodeNode('step_1'))
    flow.graph.edges.push({
        id: 'trigger-default',
        source: 'trigger',
        target: 'step_1',
        type: FlowEdgeType.DEFAULT,
    })
    return flow
}

export function createFlowVersionWithLoop(): FlowVersion {
    const flow = createEmptyFlowVersion()
    flow.graph.nodes.push(
        createLoopNode('step_1'),
        createCodeNode('step_2'),
    )
    flow.graph.edges.push(
        {
            id: 'trigger-default',
            source: 'trigger',
            target: 'step_1',
            type: FlowEdgeType.DEFAULT,
        },
        {
            id: 'step_1-loop',
            source: 'step_1',
            target: 'step_2',
            type: FlowEdgeType.LOOP,
        },
    )
    return flow
}

export function createFlowVersionWithRouter(): FlowVersion {
    const flow = createEmptyFlowVersion()
    flow.graph.nodes.push(
        createRouterNode('step_1'),
        createCodeNode('step_2'),
        createCodeNode('step_3'),
    )
    flow.graph.edges.push(
        {
            id: 'trigger-default',
            source: 'trigger',
            target: 'step_1',
            type: FlowEdgeType.DEFAULT,
        },
        {
            id: 'step_1-branch-0',
            source: 'step_1',
            target: 'step_2',
            type: FlowEdgeType.BRANCH,
            branchIndex: 0,
            branchName: 'Branch 1',
            branchType: BranchExecutionType.CONDITION,
            conditions: [
                [
                    {
                        operator: BranchOperator.TEXT_CONTAINS,
                        firstValue: '{{trigger.value}}',
                        secondValue: 'test',
                        caseSensitive: false,
                    },
                ],
            ],
        },
        {
            id: 'step_1-branch-1',
            source: 'step_1',
            target: 'step_3',
            type: FlowEdgeType.BRANCH,
            branchIndex: 1,
            branchName: 'Otherwise',
            branchType: BranchExecutionType.FALLBACK,
        },
    )
    return flow
}

function createCodeNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            displayName: 'Code',
            kind: FlowActionKind.CODE,
            valid: true,
            settings: {
                sourceCode: {
                    code: 'export const code = async (inputs) => { return {}; }',
                    packageJson: '{}',
                },
                input: {},
            },
        },
    }
}

function createPieceNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            displayName: 'Send Email',
            kind: FlowActionKind.PIECE,
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-gmail',
                pieceVersion: '~0.5.0',
                actionName: 'send_email',
                input: {},
                propertySettings: {
                    to: {
                        type: PropertyExecutionType.MANUAL,
                    },
                },
            },
        },
    }
}

function createLoopNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            displayName: 'Loop',
            kind: FlowActionKind.LOOP_ON_ITEMS,
            valid: true,
            settings: {
                items: '{{trigger.items}}',
            },
        },
    }
}

function createRouterNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            displayName: 'Router',
            kind: FlowActionKind.ROUTER,
            valid: true,
            settings: {
                executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            },
        },
    }
}

// These return UpdateActionRequest (used in operation requests)
export function createCodeAction(name: string): UpdateActionRequest {
    return {
        name,
        displayName: 'Code',
        kind: FlowActionKind.CODE,
        valid: true,
        settings: {
            sourceCode: {
                code: 'export const code = async (inputs) => { return {}; }',
                packageJson: '{}',
            },
            input: {},
        },
    }
}

export function createPieceAction(name: string): UpdateActionRequest {
    return {
        name,
        displayName: 'Send Email',
        kind: FlowActionKind.PIECE,
        valid: true,
        settings: {
            pieceName: '@activepieces/piece-gmail',
            pieceVersion: '~0.5.0',
            actionName: 'send_email',
            input: {},
            propertySettings: {
                to: {
                    type: PropertyExecutionType.MANUAL,
                },
            },
        },
    }
}

export function createLoopAction(name: string): UpdateActionRequest {
    return {
        name,
        displayName: 'Loop',
        kind: FlowActionKind.LOOP_ON_ITEMS,
        valid: true,
        settings: {
            items: '{{trigger.items}}',
        },
    }
}

export function createRouterAction(name: string): UpdateActionRequest {
    return {
        name,
        displayName: 'Router',
        kind: FlowActionKind.ROUTER,
        valid: true,
        settings: {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
        },
    }
}
