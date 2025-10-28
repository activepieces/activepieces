import {
    BranchExecutionType,
    BranchOperator,
    FlowAction,
    FlowActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    RouterExecutionType,
    StepLocationRelativeToParent,
} from '../../src'
import { _getImportOperations } from '../../src/lib/flows/operations/import-flow'

const flowVersionWithBranching: FlowVersion = {
    id: 'pj0KQ7Aypoa9OQGHzmKDl',
    created: '2023-05-24T00:16:41.353Z',
    updated: '2023-05-24T00:16:41.353Z',
    flowId: 'lod6JEdKyPlvrnErdnrGa',
    updatedBy: '',
    displayName: 'Standup Reminder',
    agentIds: [],
    trigger: {
        name: 'trigger',
        type: FlowTriggerType.PIECE,
        valid: true,
        settings: {
            input: {
                cronExpression: '25 10 * * 0,1,2,3,4',
            },
            pieceName: 'schedule',
            pieceVersion: '0.0.2',
            propertySettings: {
                'cronExpression': {
                    type: PropertyExecutionType.MANUAL,
                },
            },
            triggerName: 'cron_expression',
        },
        nextAction: {
            name: 'step_1',
            type: FlowActionType.ROUTER,
            valid: true,
            settings: {
                branches: [
                    {
                        conditions: [
                            [
                                {
                                    operator: BranchOperator.TEXT_CONTAINS,
                                    firstValue: '1',
                                    secondValue: '1',
                                    caseSensitive: true,
                                },
                            ],
                        ],
                        branchType: BranchExecutionType.CONDITION,
                        branchName: 'step_4',
                    },
                ],
                executionType: RouterExecutionType.EXECUTE_ALL_MATCH,
            },
            nextAction: {
                name: 'step_4',
                type: FlowActionType.PIECE,
                valid: true,
                settings: {
                    input: {
                        key: '1',
                    },
                    pieceName: 'store',
                    pieceVersion: '~0.2.6',
                    actionName: 'get',
                    propertySettings: {
                        'key': {
                            type: PropertyExecutionType.MANUAL,
                        },
                    },
                },
                displayName: 'Get',
            },
            displayName: 'Router',
            children: [
                {
                    name: 'step_3',
                    type: FlowActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                    displayName: 'Code',
                },
                {
                    name: 'step_2',
                    type: FlowActionType.PIECE,
                    valid: true,
                    settings: {
                        input: {
                            content: 'MESSAGE',
                            webhook_url: 'WEBHOOK_URL',
                        },
                        pieceName: 'discord',
                        pieceVersion: '0.2.1',
                        actionName: 'send_message_webhook',
                        propertySettings: {
                            'content': {
                                type: PropertyExecutionType.MANUAL,
                            },
                            'webhook_url': {
                                type: PropertyExecutionType.MANUAL,
                            },
                        },
                    },
                    displayName: 'Send Message Webhook',
                },
            ],
        },
        displayName: 'Cron Expression',
    },
    connectionIds: [],
    valid: true,
    state: FlowVersionState.DRAFT,
}

function createCodeAction(name: string): FlowAction {
    return {
        name,
        displayName: 'Code',
        type: FlowActionType.CODE,
        valid: true,
        settings: {
            sourceCode: {
                code: 'test',
                packageJson: '{}',
            },
            input: {},
        },
    }
}
const emptyScheduleFlowVersion: FlowVersion = {
    id: 'pj0KQ7Aypoa9OQGHzmKDl',
    created: '2023-05-24T00:16:41.353Z',
    updated: '2023-05-24T00:16:41.353Z',
    flowId: 'lod6JEdKyPlvrnErdnrGa',
    displayName: 'Standup Reminder',
    updatedBy: '',
    agentIds: [],
    trigger: {
        name: 'trigger',
        type: FlowTriggerType.PIECE,
        valid: true,
        settings: {
            input: {
                cronExpression: '25 10 * * 0,1,2,3,4',
            },
            pieceName: 'schedule',
            pieceVersion: '0.0.2',
            propertySettings: {
                'cronExpression': {
                    type: PropertyExecutionType.MANUAL,
                },
            },
            triggerName: 'cron_expression',
        },
        displayName: 'Cron Expression',
    },
    valid: true,
    state: FlowVersionState.DRAFT,
    connectionIds: [],
}

describe('Flow Helper', () => {
    it('should lock a flow', () => {
        const operation: FlowOperationRequest = {
            type: FlowOperationType.LOCK_FLOW,
            request: {
                flowId: flowVersionWithBranching.flowId,
            },
        }
        const result = flowOperations.apply(flowVersionWithBranching, operation)
        expect(result.state).toEqual(FlowVersionState.LOCKED)
    })

    it('should delete branch', () => {
        const operation: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: {
                names: [flowVersionWithBranching.trigger.nextAction!.name],
            },
        }
        const result = flowOperations.apply(flowVersionWithBranching, operation)
        const expectedFlowVersion: FlowVersion = {
            id: 'pj0KQ7Aypoa9OQGHzmKDl',
            updatedBy: '',
            created: '2023-05-24T00:16:41.353Z',
            updated: '2023-05-24T00:16:41.353Z',
            flowId: 'lod6JEdKyPlvrnErdnrGa',
            displayName: 'Standup Reminder',
            agentIds: [],
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                valid: true,
                settings: {
                    input: {
                        cronExpression: '25 10 * * 0,1,2,3,4',
                    },
                    pieceName: 'schedule',
                    pieceVersion: '~0.0.2',
                    propertySettings: {
                        'cronExpression': {
                            type: PropertyExecutionType.MANUAL,
                        },
                    },
                    triggerName: 'cron_expression',
                },
                displayName: 'Cron Expression',
                nextAction: {
                    name: 'step_4',
                    type: FlowActionType.PIECE,
                    valid: true,
                    settings: {
                        input: {
                            key: '1',
                        },
                        pieceName: 'store',
                        pieceVersion: '~0.2.6',
                        actionName: 'get',
                        propertySettings: {
                            'key': {
                                type: PropertyExecutionType.MANUAL,
                            },
                        },
                    },
                    displayName: 'Get',
                },
            },
            valid: true,
            state: FlowVersionState.DRAFT,
            connectionIds: [],
        }
        expect(result).toEqual(expectedFlowVersion)
    })


    it('should add loop step with actions', () => {
        const addBranchRequest: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    settings: {
                        items: 'items',
                    },
                },
            },
        }
        const addCodeActionInside: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
                action: createCodeAction('step_3'),
            },
        }
        const addCodeActionOnAfter: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: createCodeAction('step_4'),
            },
        }
        let resultFlow = emptyScheduleFlowVersion
        resultFlow = flowOperations.apply(resultFlow, addBranchRequest)
        resultFlow = flowOperations.apply(resultFlow, addCodeActionInside)
        resultFlow = flowOperations.apply(resultFlow, addCodeActionOnAfter)

        const expectedTrigger: FlowTrigger = {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            valid: true,
            settings: {
                input: {
                    cronExpression: '25 10 * * 0,1,2,3,4',
                },
                pieceName: 'schedule',
                pieceVersion: '~0.0.2',
                propertySettings: {
                    'cronExpression': {
                        type: PropertyExecutionType.MANUAL,
                    },
                },
                triggerName: 'cron_expression',
            },
            displayName: 'Cron Expression',
            nextAction: {
                displayName: 'Loop',
                name: 'step_1',
                valid: true,
                type: FlowActionType.LOOP_ON_ITEMS,
                settings: {
                    items: 'items',
                },
                firstLoopAction: {
                    displayName: 'Code',
                    name: 'step_3',
                    valid: true,
                    type: FlowActionType.CODE,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                },
                nextAction: {
                    displayName: 'Code',
                    name: 'step_4',
                    valid: true,
                    type: FlowActionType.CODE,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                },
            },
        }
        expect(resultFlow.trigger).toEqual(expectedTrigger)
    })
})

test('Duplicate Flow With Loops using Import', () => {
    const flowVersion: FlowVersion = {
        id: '2XuLcKZWSgKkiHh6RqWXg',
        created: '2023-05-23T00:14:47.809Z',
        updated: '2023-05-23T00:14:47.809Z',
        flowId: 'YGPIPQDfLcPdJ0aJ9AKGb',
        updatedBy: '',
        displayName: 'Flow 1',
        agentIds: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            valid: true,
            settings: {
                input: {
                    repository: {
                        repo: 'activepieces',
                        owner: 'activepieces',
                    },
                    authentication: '{{connections.github}}',
                },
                pieceName: 'github',
                pieceVersion: '0.1.3',
                propertySettings: {
                    'repository': {
                        type: PropertyExecutionType.MANUAL,
                    },
                    'authentication': {
                        type: PropertyExecutionType.MANUAL,
                    },
                },
                triggerName: 'trigger_star',
            },
            nextAction: {
                name: 'step_1',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: false,
                settings: {
                    items: '',
                },
                nextAction: {
                    name: 'step_3',
                    type: FlowActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                    displayName: 'Code',
                },
                displayName: 'Loop on Items',
                firstLoopAction: {
                    name: 'step_2',
                    type: FlowActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                    displayName: 'Code',
                },
            },
            displayName: 'Trigger',
        },
        valid: false,
        state: FlowVersionState.DRAFT,
        connectionIds: [],
    }
    const expectedResult: FlowOperationRequest[] = [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: {
                    name: 'step_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: false,
                    settings: {
                        items: '',
                    },
                    displayName: 'Loop on Items',
                },
            },
        },
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: {
                    name: 'step_3',
                    type: FlowActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                    displayName: 'Code',
                },
            },
        },
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
                action: {
                    name: 'step_2',
                    type: FlowActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'test',
                            packageJson: '{}',
                        },
                    },
                    displayName: 'Code',
                },
            },
        },
    ]

    const importOperations = _getImportOperations(flowVersion.trigger)
    expect(importOperations).toEqual(expectedResult)
})
