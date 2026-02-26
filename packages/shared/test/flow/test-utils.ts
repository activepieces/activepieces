import {
    BranchExecutionType,
    BranchOperator,
    FlowAction,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    RouterExecutionType,
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
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            valid: true,
            settings: {
                input: {},
                pieceName: 'schedule',
                pieceVersion: '0.0.1',
                propertySettings: {},
                triggerName: 'every_hour',
            },
            steps: [],
            displayName: 'Schedule',
        },
        steps: [],
        connectionIds: [],
        valid: true,
        state: FlowVersionState.DRAFT,
    }
}

export function createFlowVersionWithSimpleAction(): FlowVersion {
    return {
        ...createEmptyFlowVersion(),
        trigger: {
            ...createEmptyFlowVersion().trigger,
            steps: ['step_1'],
        },
        steps: [createCodeAction('step_1')],
    }
}

export function createFlowVersionWithLoop(): FlowVersion {
    return {
        ...createEmptyFlowVersion(),
        trigger: {
            ...createEmptyFlowVersion().trigger,
            steps: ['step_1'],
        },
        steps: [
            {
                name: 'step_1',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: true,
                displayName: 'Loop',
                settings: {
                    items: '{{trigger.items}}',
                },
                children: ['step_2'],
            },
            createCodeAction('step_2'),
        ],
    }
}

export function createFlowVersionWithRouter(): FlowVersion {
    return {
        ...createEmptyFlowVersion(),
        trigger: {
            ...createEmptyFlowVersion().trigger,
            steps: ['step_1'],
        },
        steps: [
            createRouterAction('step_1'),
            createCodeAction('step_2'),
            createCodeAction('step_3'),
        ],
    }
}

export function createCodeAction(name: string): FlowAction {
    return {
        name,
        displayName: 'Code',
        type: FlowActionType.CODE,
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

export function createPieceAction(name: string): FlowAction {
    return {
        name,
        displayName: 'Send Email',
        type: FlowActionType.PIECE,
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

export function createLoopAction(name: string): FlowAction {
    return {
        name,
        displayName: 'Loop',
        type: FlowActionType.LOOP_ON_ITEMS,
        valid: true,
        settings: {
            items: '{{trigger.items}}',
        },
        children: [],
    }
}

export function createRouterAction(name: string): FlowAction {
    return {
        name,
        displayName: 'Router',
        type: FlowActionType.ROUTER,
        valid: true,
        settings: {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
        },
        branches: [
            {
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
                branchType: BranchExecutionType.CONDITION,
                branchName: 'Branch 1',
                steps: ['step_2'],
            },
            {
                branchType: BranchExecutionType.FALLBACK,
                branchName: 'Otherwise',
                steps: ['step_3'],
            },
        ],
    }
}
