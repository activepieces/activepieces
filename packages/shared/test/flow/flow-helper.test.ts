import {
    BranchExecutionType,
    BranchOperator,
    CodeAction,
    FlowAction,
    FlowActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    RouterExecutionType,
    StepLocationRelativeToParent,
} from '../../src'
import { _getImportOperations } from '../../src/lib/automation/flows/operations/import-flow'

const flowVersionWithBranching: FlowVersion = {
    id: 'pj0KQ7Aypoa9OQGHzmKDl',
    created: '2023-05-24T00:16:41.353Z',
    updated: '2023-05-24T00:16:41.353Z',
    flowId: 'lod6JEdKyPlvrnErdnrGa',
    updatedBy: '',
    displayName: 'Standup Reminder',
    agentIds: [],
    notes: [],
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
                    pieceVersion: '0.2.6',
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
    notes: [],
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
            notes: [],
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
                    pieceVersion: '0.0.2',
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
                        pieceVersion: '0.2.6',
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
                pieceVersion: '0.0.2',
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
                lastUpdatedDate: expect.any(String),
                firstLoopAction: {
                    displayName: 'Code',
                    name: 'step_3',
                    valid: true,
                    type: FlowActionType.CODE,
                    lastUpdatedDate: expect.any(String),
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
                    lastUpdatedDate: expect.any(String),
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

    describe('isChildOf', () => {
        it('recognises a step inside a LOOP_ON_ITEMS as a child', () => {
            const loop: FlowAction = {
                name: 'loop',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: true,
                displayName: 'Loop',
                lastUpdatedDate: '2026-05-02T00:00:00.000Z',
                settings: { items: '' },
                firstLoopAction: createCodeAction('inner_step'),
            }
            expect(flowStructureUtil.isChildOf(loop, 'inner_step')).toBe(true)
        })

        it('recognises a deeply nested step inside a LOOP_ON_ITEMS as a child', () => {
            const loop: FlowAction = {
                name: 'loop',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: true,
                displayName: 'Loop',
                lastUpdatedDate: '2026-05-02T00:00:00.000Z',
                settings: { items: '' },
                firstLoopAction: {
                    ...createCodeAction('inner_step'),
                    nextAction: createCodeAction('deep_step'),
                },
            }
            expect(flowStructureUtil.isChildOf(loop, 'deep_step')).toBe(true)
        })

        it('recognises a step inside a ROUTER branch as a child', () => {
            const router: FlowAction = {
                name: 'router',
                type: FlowActionType.ROUTER,
                valid: true,
                displayName: 'Router',
                lastUpdatedDate: '2026-05-02T00:00:00.000Z',
                settings: {
                    branches: [
                        {
                            branchName: 'branch_a',
                            branchType: BranchExecutionType.CONDITION,
                            conditions: [[]],
                        },
                    ],
                    executionType: RouterExecutionType.EXECUTE_ALL_MATCH,
                },
                children: [createCodeAction('branch_a_step')],
            }
            expect(flowStructureUtil.isChildOf(router, 'branch_a_step')).toBe(true)
        })

        it('recognises a step inside a CoF onSuccess branch as a child', () => {
            const cofParent = buildCofCodeAction({
                name: 'cof',
                onSuccess: createCodeAction('success_head'),
                onFailure: createCodeAction('failure_head'),
            })
            expect(flowStructureUtil.isChildOf(cofParent, 'success_head')).toBe(true)
        })

        it('recognises a step inside a CoF onFailure branch as a child', () => {
            const cofParent = buildCofCodeAction({
                name: 'cof',
                onSuccess: createCodeAction('success_head'),
                onFailure: createCodeAction('failure_head'),
            })
            expect(flowStructureUtil.isChildOf(cofParent, 'failure_head')).toBe(true)
        })

        it('recognises a deeply nested step inside a CoF branch as a child', () => {
            const cofParent = buildCofCodeAction({
                name: 'cof',
                onSuccess: {
                    ...createCodeAction('success_head'),
                    nextAction: createCodeAction('success_tail'),
                },
                onFailure: createCodeAction('failure_head'),
            })
            expect(flowStructureUtil.isChildOf(cofParent, 'success_tail')).toBe(true)
        })

        it('returns false for a step that is not part of any descendant', () => {
            const cofParent = buildCofCodeAction({
                name: 'cof',
                onSuccess: createCodeAction('success_head'),
                onFailure: createCodeAction('failure_head'),
            })
            expect(flowStructureUtil.isChildOf(cofParent, 'unrelated')).toBe(false)
        })

        it('returns false when called with the parent step name itself', () => {
            const cofParent = buildCofCodeAction({
                name: 'cof',
                onSuccess: createCodeAction('success_head'),
            })
            expect(flowStructureUtil.isChildOf(cofParent, 'cof')).toBe(false)
        })

        it('returns false for a CODE step without CoF branches', () => {
            const plain = createCodeAction('plain')
            expect(flowStructureUtil.isChildOf(plain, 'anything')).toBe(false)
        })

        it('does not include the next action of the parent as a child', () => {
            const cofParent = buildCofCodeAction({
                name: 'cof',
                onSuccess: createCodeAction('success_head'),
                nextAction: createCodeAction('next_step'),
            })
            expect(flowStructureUtil.isChildOf(cofParent, 'next_step')).toBe(false)
        })
    })
})

function buildCofCodeAction({
    name,
    onSuccess,
    onFailure,
    nextAction,
}: {
    name: string
    onSuccess?: FlowAction
    onFailure?: FlowAction
    nextAction?: FlowAction
}): CodeAction {
    return {
        name,
        type: FlowActionType.CODE,
        valid: true,
        displayName: name,
        lastUpdatedDate: '2026-05-02T00:00:00.000Z',
        settings: {
            sourceCode: { code: '', packageJson: '{}' },
            input: {},
            errorHandlingOptions: {
                continueOnFailure: { value: true },
                retryOnFailure: { value: false },
                continueOnFailureBranches: { onSuccess, onFailure },
            },
        },
        nextAction,
    }
}

test('Duplicate Flow With Loops using Import', () => {
    const flowVersion: FlowVersion = {
        notes: [],
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
