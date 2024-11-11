import {
    Action,
    ActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
    FlowVersionState,
    PackageType,
    PieceType,
    StepLocationRelativeToParent,
    Trigger,
    TriggerType,
} from '../../src'
import { _getImportOperations } from '../../src/lib/flows/operations/import-flow'

const flowVersionWithBranching: FlowVersion = {
    id: 'pj0KQ7Aypoa9OQGHzmKDl',
    created: '2023-05-24T00:16:41.353Z',
    updated: '2023-05-24T00:16:41.353Z',
    flowId: 'lod6JEdKyPlvrnErdnrGa',
    updatedBy: '',
    displayName: 'Standup Reminder',
    trigger: {
        name: 'trigger',
        type: TriggerType.PIECE,
        valid: true,
        settings: {
            input: {
                cronExpression: '25 10 * * 0,1,2,3,4',
            },
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            pieceName: 'schedule',
            pieceVersion: '0.0.2',
            inputUiInfo: {},
            triggerName: 'cron_expression',
        },
        nextAction: {
            name: 'step_1',
            type: 'ROUTER',
            valid: true,
            settings: {
                conditions: [
                    [
                        {
                            operator: 'TEXT_CONTAINS',
                            firstValue: '1',
                            secondValue: '1',
                            caseSensitive: true,
                        },
                    ],
                ],
            },
            nextAction: {
                name: 'step_4',
                type: 'PIECE',
                valid: true,
                settings: {
                    input: {
                        key: '1',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                    pieceName: 'store',
                    pieceVersion: '~0.2.6',
                    actionName: 'get',
                    inputUiInfo: {
                        customizedInputs: {},
                    },
                },
                displayName: 'Get',
            },
            displayName: 'Router',
            onFailureAction: {
                name: 'step_3',
                type: 'CODE',
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
            onSuccessAction: {
                name: 'step_2',
                type: 'PIECE',
                valid: true,
                settings: {
                    input: {
                        content: 'MESSAGE',
                        webhook_url: 'WEBHOOK_URL',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                    pieceName: 'discord',
                    pieceVersion: '0.2.1',
                    actionName: 'send_message_webhook',
                    inputUiInfo: {
                        customizedInputs: {},
                    },
                },
                displayName: 'Send Message Webhook',
            },
        },
        displayName: 'Cron Expression',
    },
    valid: true,
    state: FlowVersionState.DRAFT,
}

function createCodeAction(name: string): Action {
    return {
        name,
        displayName: 'Code',
        type: ActionType.CODE,
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
    trigger: {
        name: 'trigger',
        type: TriggerType.PIECE,
        valid: true,
        settings: {
            input: {
                cronExpression: '25 10 * * 0,1,2,3,4',
            },
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            pieceName: 'schedule',
            pieceVersion: '0.0.2',
            inputUiInfo: {},
            triggerName: 'cron_expression',
        },
        displayName: 'Cron Expression',
    },
    valid: true,
    state: FlowVersionState.DRAFT,
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
                name: flowVersionWithBranching.trigger.nextAction.name,
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
            trigger: {
                name: 'trigger',
                type: TriggerType.PIECE,
                valid: true,
                settings: {
                    input: {
                        cronExpression: '25 10 * * 0,1,2,3,4',
                    },
                    packageType: PackageType.REGISTRY,
                    pieceType: PieceType.OFFICIAL,
                    pieceName: 'schedule',
                    pieceVersion: '~0.0.2',
                    inputUiInfo: {},
                    triggerName: 'cron_expression',
                },
                displayName: 'Cron Expression',
                nextAction: {
                    name: 'step_4',
                    type: 'PIECE',
                    valid: true,
                    settings: {
                        input: {
                            key: '1',
                        },
                        packageType: PackageType.REGISTRY,
                        pieceType: PieceType.OFFICIAL,
                        pieceName: 'store',
                        pieceVersion: '~0.2.6',
                        actionName: 'get',
                        inputUiInfo: {
                            customizedInputs: {},
                        },
                    },
                    displayName: 'Get',
                },
            },
            valid: true,
            state: FlowVersionState.DRAFT,
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
        resultFlow = flowOperations.apply(resultFlow, addBranchRequest)
        resultFlow = flowOperations.apply(resultFlow, addCodeActionInside)
        resultFlow = flowOperations.apply(resultFlow, addCodeActionOnAfter)

        const expectedTrigger: Trigger = {
            name: 'trigger',
            type: TriggerType.PIECE,
            valid: true,
            settings: {
                input: {
                    cronExpression: '25 10 * * 0,1,2,3,4',
                },
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
                pieceName: 'schedule',
                pieceVersion: '~0.0.2',
                inputUiInfo: {},
                triggerName: 'cron_expression',
            },
            displayName: 'Cron Expression',
            nextAction: {
                displayName: 'Loop',
                name: 'step_1',
                valid: true,
                type: 'LOOP_ON_ITEMS',
                settings: {
                    items: 'items',
                    inputUiInfo: {},
                },
                firstLoopAction: {
                    displayName: 'Code',
                    name: 'step_3',
                    valid: true,
                    type: 'CODE',
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
                    type: 'CODE',
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
        trigger: {
            name: 'trigger',
            type: TriggerType.PIECE,
            valid: true,
            settings: {
                input: {
                    repository: {
                        repo: 'activepieces',
                        owner: 'activepieces',
                    },
                    authentication: '{{connections.github}}',
                },
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
                pieceName: 'github',
                pieceVersion: '0.1.3',
                inputUiInfo: {},
                triggerName: 'trigger_star',
            },
            nextAction: {
                name: 'step_1',
                type: 'LOOP_ON_ITEMS',
                valid: false,
                settings: {
                    items: '',
                    inputUiInfo: {},
                },
                nextAction: {
                    name: 'step_3',
                    type: 'CODE',
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
                    type: 'CODE',
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
    }
    const expectedResult: FlowOperationRequest[] = [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
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
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: {
                    name: 'step_3',
                    type: ActionType.CODE,
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
                    type: ActionType.CODE,
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
