import {
    Action,
    ActionType,
    BranchOperator,
    flowHelper,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    FlowVersionState,
    PackageType,
    PieceType,
    StepLocationRelativeToParent,
    Trigger,
    TriggerType,
} from '../../src'

const flowVersionWithBranching: FlowVersion = {
    'id': 'pj0KQ7Aypoa9OQGHzmKDl',
    'created': '2023-05-24T00:16:41.353Z',
    'updated': '2023-05-24T00:16:41.353Z',
    'flowId': 'lod6JEdKyPlvrnErdnrGa',
    'updatedBy': '',
    'displayName': 'Standup Reminder',
    'trigger': {
        'name': 'trigger',
        'type': TriggerType.PIECE,
        'valid': true,
        'settings': {
            'input': {
                'cronExpression': '25 10 * * 0,1,2,3,4',
            },
            'packageType': PackageType.REGISTRY,
            'pieceType': PieceType.OFFICIAL,
            'pieceName': 'schedule',
            'pieceVersion': '0.0.2',
            'inputUiInfo': {

            },
            'triggerName': 'cron_expression',
        },
        'nextAction': {
            'name': 'step_1',
            'type': 'BRANCH',
            'valid': true,
            'settings': {
                'conditions': [
                    [
                        {
                            'operator': 'TEXT_CONTAINS',
                            'firstValue': '1',
                            'secondValue': '1',
                            caseSensitive: true,
                        },
                    ],
                ],
            },
            'nextAction': {
                'name': 'step_4',
                'type': 'PIECE',
                'valid': true,
                'settings': {
                    'input': {
                        'key': '1',
                    },
                    'packageType': PackageType.REGISTRY,
                    'pieceType': PieceType.OFFICIAL,
                    'pieceName': 'store',
                    'pieceVersion': '0.2.6',
                    'actionName': 'get',
                    'inputUiInfo': {
                        'customizedInputs': {

                        },
                    },
                },
                'displayName': 'Get',
            },
            'displayName': 'Branch',
            'onFailureAction': {
                'name': 'step_3',
                'type': 'CODE',
                'valid': true,
                'settings': {
                    'input': {

                    },
                    'sourceCode': {
                        'code': 'test',
                        'packageJson': '{}',
                    },
                },
                'displayName': 'Code',
            },
            'onSuccessAction': {
                'name': 'step_2',
                'type': 'PIECE',
                'valid': true,
                'settings': {
                    'input': {
                        'content': 'MESSAGE',
                        'webhook_url': 'WEBHOOK_URL',
                    },
                    'packageType': PackageType.REGISTRY,
                    'pieceType': PieceType.OFFICIAL,
                    'pieceName': 'discord',
                    'pieceVersion': '0.2.1',
                    'actionName': 'send_message_webhook',
                    'inputUiInfo': {
                        'customizedInputs': {

                        },
                    },
                },
                'displayName': 'Send Message Webhook',
            },
        },
        'displayName': 'Cron Expression',
    },
    'valid': true,
    'state': FlowVersionState.DRAFT,
}

function createCodeAction(name: string): Action {
    return {
        name,
        'displayName': 'Code',
        'type': ActionType.CODE,
        'valid': true,
        'settings': {
            'sourceCode': {
                'code': 'test',
                'packageJson': '{}',
            },
            'input': {
            },
        },
    }
}
const emptyScheduleFlowVersion: FlowVersion = {
    'id': 'pj0KQ7Aypoa9OQGHzmKDl',
    'created': '2023-05-24T00:16:41.353Z',
    'updated': '2023-05-24T00:16:41.353Z',
    'flowId': 'lod6JEdKyPlvrnErdnrGa',
    'displayName': 'Standup Reminder',
    'updatedBy': '',
    'trigger': {
        'name': 'trigger',
        'type': TriggerType.PIECE,
        'valid': true,
        'settings': {
            'input': {
                'cronExpression': '25 10 * * 0,1,2,3,4',
            },
            'packageType': PackageType.REGISTRY,
            'pieceType': PieceType.OFFICIAL,
            'pieceName': 'schedule',
            'pieceVersion': '0.0.2',
            'inputUiInfo': {

            },
            'triggerName': 'cron_expression',
        },
        'displayName': 'Cron Expression',
    },
    'valid': true,
    'state': FlowVersionState.DRAFT,
}

describe('Flow Helper', () => {

    it('should lock a flow', () => {
        const operation: FlowOperationRequest = {
            type: FlowOperationType.LOCK_FLOW,
            request: {
                flowId: flowVersionWithBranching.flowId,
            },
        }
        const result = flowHelper.apply(flowVersionWithBranching, operation)
        expect(result.state).toEqual(FlowVersionState.LOCKED)
    })

    it('should delete branch', () => {
        const operation: FlowOperationRequest = {
            type: FlowOperationType.DELETE_ACTION,
            request: {
                name: flowVersionWithBranching.trigger.nextAction.name,
            },
        }
        const result = flowHelper.apply(flowVersionWithBranching, operation)
        const expectedFlowVersion: FlowVersion = {
            'id': 'pj0KQ7Aypoa9OQGHzmKDl',
            'updatedBy': '',
            'created': '2023-05-24T00:16:41.353Z',
            'updated': '2023-05-24T00:16:41.353Z',
            'flowId': 'lod6JEdKyPlvrnErdnrGa',
            'displayName': 'Standup Reminder',
            'trigger': {
                'name': 'trigger',
                'type': TriggerType.PIECE,
                'valid': true,
                'settings': {
                    'input': {
                        'cronExpression': '25 10 * * 0,1,2,3,4',
                    },
                    'packageType': PackageType.REGISTRY,
                    'pieceType': PieceType.OFFICIAL,
                    'pieceName': 'schedule',
                    'pieceVersion': '0.0.2',
                    'inputUiInfo': {},
                    'triggerName': 'cron_expression',
                },
                'displayName': 'Cron Expression',
                'nextAction': {
                    'name': 'step_4',
                    'type': 'PIECE',
                    'valid': true,
                    'settings': {
                        'input': {
                            'key': '1',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'store',
                        'pieceVersion': '0.2.6',
                        'actionName': 'get',
                        'inputUiInfo': {
                            'customizedInputs': {

                            },
                        },
                    },
                    'displayName': 'Get',
                },
            },
            'valid': true,
            'state': FlowVersionState.DRAFT,
        }
        expect(result).toEqual(expectedFlowVersion)
    })

    it('should update branch', () => {
        const updateRequest: FlowOperationRequest = {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                type: ActionType.BRANCH,
                displayName: 'Branch',
                valid: true,
                settings: {
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
                    inputUiInfo: {},
                },
            },
        }
        const updateFlowVersion = flowHelper.apply(flowVersionWithBranching, updateRequest)
        const expectedFlowTrigger: Trigger = {
            'name': 'trigger',
            'type': TriggerType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'cronExpression': '25 10 * * 0,1,2,3,4',
                },
                'packageType': PackageType.REGISTRY,
                'pieceType': PieceType.OFFICIAL,
                'pieceName': 'schedule',
                'pieceVersion': '0.0.2',
                'inputUiInfo': {},
                'triggerName': 'cron_expression',
            },
            'nextAction': {
                'displayName': 'Branch',
                'name': 'step_1',
                'valid': true,
                'nextAction': {
                    'name': 'step_4',
                    'type': 'PIECE',
                    'valid': true,
                    'settings': {
                        'input': {
                            'key': '1',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'store',
                        'pieceVersion': '0.2.6',
                        'actionName': 'get',
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                    },
                    'displayName': 'Get',
                },
                'onFailureAction': {
                    'name': 'step_3',
                    'type': 'CODE',
                    'valid': true,
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                    'displayName': 'Code',
                },
                'onSuccessAction': {
                    'name': 'step_2',
                    'type': 'PIECE',
                    'valid': true,
                    'settings': {
                        'input': {
                            'content': 'MESSAGE',
                            'webhook_url': 'WEBHOOK_URL',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'discord',
                        'pieceVersion': '0.2.1',
                        'actionName': 'send_message_webhook',
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                    },
                    'displayName': 'Send Message Webhook',
                },
                'type': 'BRANCH',
                'settings': {
                    'conditions': [
                        [
                            {
                                'operator': 'TEXT_CONTAINS',
                                'firstValue': '1',
                                'secondValue': '1',
                                caseSensitive: true,
                            },
                        ],
                    ],
                    'inputUiInfo': {},
                },
            },
            'displayName': 'Cron Expression',
        }
        expect(updateFlowVersion.trigger).toEqual(expectedFlowTrigger)
    })

    it('should add branch step with actions', () => {
        const addBranchRequest: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: ActionType.BRANCH,
                    displayName: 'Branch',
                    valid: true,
                    settings: {
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
                        inputUiInfo: {},
                    },
                },
            },
        }
        const addCodeActionOnTrue: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
                action: createCodeAction('step_2'),
            },
        }
        const addCodeActionOnFalse: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
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
        resultFlow = flowHelper.apply(resultFlow, addBranchRequest)
        resultFlow = flowHelper.apply(resultFlow, addCodeActionOnTrue)
        resultFlow = flowHelper.apply(resultFlow, addCodeActionOnFalse)
        resultFlow = flowHelper.apply(resultFlow, addCodeActionOnAfter)
        const expectedTrigger: Trigger = {
            'name': 'trigger',
            'type': TriggerType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'cronExpression': '25 10 * * 0,1,2,3,4',
                },
                'packageType': PackageType.REGISTRY,
                'pieceType': PieceType.OFFICIAL,
                'pieceName': 'schedule',
                'pieceVersion': '0.0.2',
                'inputUiInfo': {},
                'triggerName': 'cron_expression',
            },
            'displayName': 'Cron Expression',
            'nextAction': {
                'displayName': 'Branch',
                'name': 'step_1',
                'valid': true,
                'type': 'BRANCH',
                'settings': {
                    'conditions': [
                        [
                            {
                                'operator': 'TEXT_CONTAINS',
                                'firstValue': '1',
                                'secondValue': '1',
                                caseSensitive: true,
                            },
                        ],
                    ],
                    'inputUiInfo': {},
                },
                'onSuccessAction': {
                    'displayName': 'Code',
                    'name': 'step_2',
                    'valid': true,
                    'type': 'CODE',
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                },
                'onFailureAction': {
                    'displayName': 'Code',
                    'name': 'step_3',
                    'valid': true,
                    'type': 'CODE',
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                },
                'nextAction': {
                    'displayName': 'Code',
                    'name': 'step_4',
                    'valid': true,
                    'type': 'CODE',
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                },
            },
        }
        expect(resultFlow.trigger).toEqual(expectedTrigger)
    })

    it('should add loop step with actions', () => {
        const addBranchRequest: FlowOperationRequest = {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: ActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    settings: {
                        items: 'items',
                        inputUiInfo: {},
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
        resultFlow = flowHelper.apply(resultFlow, addBranchRequest)
        resultFlow = flowHelper.apply(resultFlow, addCodeActionInside)
        resultFlow = flowHelper.apply(resultFlow, addCodeActionOnAfter)

        const expectedTrigger: Trigger = {
            'name': 'trigger',
            'type': TriggerType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'cronExpression': '25 10 * * 0,1,2,3,4',
                },
                'packageType': PackageType.REGISTRY,
                'pieceType': PieceType.OFFICIAL,
                'pieceName': 'schedule',
                'pieceVersion': '0.0.2',
                'inputUiInfo': {},
                'triggerName': 'cron_expression',
            },
            'displayName': 'Cron Expression',
            'nextAction': {
                'displayName': 'Loop',
                'name': 'step_1',
                'valid': true,
                'type': 'LOOP_ON_ITEMS',
                'settings': {
                    'items': 'items',
                    'inputUiInfo': {},
                },
                'firstLoopAction': {
                    'displayName': 'Code',
                    'name': 'step_3',
                    'valid': true,
                    'type': 'CODE',
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                },
                'nextAction': {
                    'displayName': 'Code',
                    'name': 'step_4',
                    'valid': true,
                    'type': 'CODE',
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                },
            },
        }
        expect(resultFlow.trigger).toEqual(expectedTrigger)
    })
})


test('Duplicate Flow With Branch', () => {
    const flowVersion: FlowVersion = {
        'id': 'pj0KQ7Aypoa9OQGHzmKDl',
        'created': '2023-05-24T00:16:41.353Z',
        'updated': '2023-05-24T00:16:41.353Z',
        'flowId': 'lod6JEdKyPlvrnErdnrGa',
        'updatedBy': '',
        'displayName': 'Standup Reminder',
        'trigger': {
            'name': 'trigger',
            'type': TriggerType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'cronExpression': '25 10 * * 0,1,2,3,4',
                },
                'packageType': PackageType.REGISTRY,
                'pieceType': PieceType.OFFICIAL,
                'pieceName': 'schedule',
                'pieceVersion': '0.0.2',
                'inputUiInfo': {},
                'triggerName': 'cron_expression',
            },
            'nextAction': {
                'name': 'step_1',
                'type': 'BRANCH',
                'valid': true,
                'settings': {
                    'conditions': [
                        [
                            {
                                'operator': 'TEXT_CONTAINS',
                                'firstValue': '1',
                                'secondValue': '1',
                                caseSensitive: true,
                            },
                        ],
                    ],
                    'inputUiInfo': {},
                },
                'nextAction': {
                    'name': 'step_4',
                    'type': 'PIECE',
                    'valid': true,
                    'settings': {
                        'input': {
                            'key': '1',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'store',
                        'pieceVersion': '0.2.6',
                        'actionName': 'get',
                        'inputUiInfo': {
                            'customizedInputs': {

                            },
                        },
                    },
                    'displayName': 'Get',
                },
                'displayName': 'Branch',
                'onFailureAction': {
                    'name': 'step_3',
                    'type': 'CODE',
                    'valid': true,
                    'settings': {
                        'input': {

                        },
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                    'displayName': 'Code',
                },
                'onSuccessAction': {
                    'name': 'step_2',
                    'type': 'PIECE',
                    'valid': true,
                    'settings': {
                        'input': {
                            'content': 'MESSAGE',
                            'webhook_url': 'WEBHOOK_URL',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'discord',
                        'pieceVersion': '0.2.1',
                        'actionName': 'send_message_webhook',
                        'inputUiInfo': {
                            'customizedInputs': {

                            },
                        },
                    },
                    'displayName': 'Send Message Webhook',
                },
            },
            'displayName': 'Cron Expression',
        },
        'valid': true,
        'state': FlowVersionState.DRAFT,
    }
    const expectedImportOperations: FlowOperationRequest[] =  [
        {
            'type': FlowOperationType.ADD_ACTION,
            'request': {
                'parentStep': 'trigger',
                'action': {
                    'type': ActionType.BRANCH,
                    'name': 'step_1',
                    'displayName': 'Branch',
                    'settings': {
                        'conditions': [
                            [
                                {
                                    'operator': BranchOperator.TEXT_CONTAINS,
                                    'firstValue': '1',
                                    'secondValue': '1',
                                    caseSensitive: true,
                                },
                            ],
                        ],
                        inputUiInfo: {},
                    },
                    'valid': true,
                },
            },
        },
        {
            'type': FlowOperationType.ADD_ACTION,
            'request': {
                'parentStep': 'step_1',
                'action': {
                    'type': ActionType.PIECE,
                    'name': 'step_4',
                    'displayName': 'Get',
                    'settings': {
                        'input': {
                            'key': '1',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'store',
                        'pieceVersion': '0.2.6',
                        'actionName': 'get',
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                    },
                    'valid': true,
                },
            },
        },
        {
            'type': FlowOperationType.ADD_ACTION,
            'request': {
                'parentStep': 'step_1',
                'stepLocationRelativeToParent': StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
                'action': {
                    'type': ActionType.CODE,
                    'name': 'step_3',
                    'displayName': 'Code',
                    'settings': {
                        'input': {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                    'valid': true,
                },
            },
        },
        {
            'type': FlowOperationType.ADD_ACTION,
            'request': {
                'parentStep': 'step_1',
                'stepLocationRelativeToParent': StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
                'action': {
                    'type': ActionType.PIECE,
                    'name': 'step_2',
                    'displayName': 'Send Message Webhook',
                    'settings': {
                        'input': {
                            'content': 'MESSAGE',
                            'webhook_url': 'WEBHOOK_URL',
                        },
                        'packageType': PackageType.REGISTRY,
                        'pieceType': PieceType.OFFICIAL,
                        'pieceName': 'discord',
                        'pieceVersion': '0.2.1',
                        'actionName': 'send_message_webhook',
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                    },
                    'valid': true,
                },
            },
        },
    ]
    const importOperations = flowHelper.getImportOperations(flowVersion.trigger)
    expect(importOperations).toEqual(expectedImportOperations)
})
test('Duplicate Flow With Loops using Import', () => {
    const flowVersion: FlowVersion = {
        'id': '2XuLcKZWSgKkiHh6RqWXg',
        'created': '2023-05-23T00:14:47.809Z',
        'updated': '2023-05-23T00:14:47.809Z',
        'flowId': 'YGPIPQDfLcPdJ0aJ9AKGb',
        'updatedBy': '',
        'displayName': 'Flow 1',
        'trigger': {
            'name': 'trigger',
            'type': TriggerType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'repository': {
                        'repo': 'activepieces',
                        'owner': 'activepieces',
                    },
                    'authentication': '{{connections.github}}',
                },
                'packageType': PackageType.REGISTRY,
                'pieceType': PieceType.OFFICIAL,
                'pieceName': 'github',
                'pieceVersion': '0.1.3',
                'inputUiInfo': {

                },
                'triggerName': 'trigger_star',
            },
            'nextAction': {
                'name': 'step_1',
                'type': 'LOOP_ON_ITEMS',
                'valid': false,
                'settings': {
                    'items': '',
                    'inputUiInfo': {},
                },
                'nextAction': {
                    'name': 'step_3',
                    'type': 'CODE',
                    'valid': true,
                    'settings': {
                        'input': {

                        },
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                    'displayName': 'Code',
                },
                'displayName': 'Loop on Items',
                'firstLoopAction': {
                    'name': 'step_2',
                    'type': 'CODE',
                    'valid': true,
                    'settings': {
                        'input': {

                        },
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                    'displayName': 'Code',
                },
            },
            'displayName': 'Trigger',
        },
        'valid': false,
        'state': FlowVersionState.DRAFT,
    }
    const expectedResult: FlowOperationRequest[] = [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: ActionType.LOOP_ON_ITEMS,
                    valid: false,
                    settings: {
                        items: '',
                        inputUiInfo: {},
                    },
                    displayName: 'Loop on Items',
                },
            },
        },
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                action: {
                    name: 'step_3',
                    type: ActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
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
                    type: ActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        'sourceCode': {
                            'code': 'test',
                            'packageJson': '{}',
                        },
                    },
                    displayName: 'Code',
                },
            },
        },
    ]

    const importOperations = flowHelper.getImportOperations(flowVersion.trigger)
    expect(importOperations).toEqual(expectedResult)
})
