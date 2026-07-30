import {
    BranchExecutionType,
    BranchOperator,
    BranchTextCondition,
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
    LoopOnItemsAction,
    PieceAction,
    PropertyExecutionType,
    RouterAction,
    RouterExecutionType,
    SourceCode,
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
            },
        },
        continueOnFailureBranches: { onSuccess, onFailure },
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

describe('Paste remaps references to copied steps (GIT-1075)', () => {
    const originalNames = ['trigger', 'step_1', 'step_2']

    function flowWith({ secondStep, codeStepName = 'step_1', codeSourceCode = { code: 'test', packageJson: '{}' } }: {
        secondStep: FlowAction
        codeStepName?: string
        codeSourceCode?: SourceCode
    }): FlowVersion {
        return {
            id: 'git1075flowversionid',
            created: '2023-05-24T00:16:41.353Z',
            updated: '2023-05-24T00:16:41.353Z',
            flowId: 'git1075flowid',
            updatedBy: '',
            displayName: 'GIT-1075',
            agentIds: [],
            notes: [],
            valid: true,
            state: FlowVersionState.DRAFT,
            connectionIds: [],
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                valid: true,
                settings: {
                    input: { cronExpression: '25 10 * * *' },
                    pieceName: 'schedule',
                    pieceVersion: '0.0.2',
                    propertySettings: {
                        cronExpression: { type: PropertyExecutionType.MANUAL },
                    },
                    triggerName: 'cron_expression',
                },
                displayName: 'Cron',
                nextAction: {
                    name: codeStepName,
                    type: FlowActionType.CODE,
                    valid: true,
                    settings: {
                        input: {},
                        sourceCode: codeSourceCode,
                    },
                    displayName: 'Code',
                    nextAction: secondStep,
                },
            },
        }
    }

    function paste(flowVersion: FlowVersion): FlowVersion {
        const actions = flowOperations.getActionsForCopy(['step_1', 'step_2'], flowVersion)
        const operations = flowOperations.getOperationsForPaste(actions, flowVersion, {
            parentStepName: 'step_2',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        })
        return operations.reduce((flow, operation) => flowOperations.apply(flow, operation), flowVersion)
    }

    function routerReferencing(codeStepName: string, routerName = 'step_2'): FlowAction {
        return {
            name: routerName,
            type: FlowActionType.ROUTER,
            valid: true,
            settings: {
                branches: [
                    {
                        conditions: [[{
                            operator: BranchOperator.TEXT_CONTAINS,
                            firstValue: `{{ ${codeStepName}['output'].value }}`,
                            secondValue: 'x',
                            caseSensitive: true,
                        }]],
                        branchType: BranchExecutionType.CONDITION,
                        branchName: 'Branch 1',
                    },
                    { branchType: BranchExecutionType.FALLBACK, branchName: 'Otherwise' },
                ],
                executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            },
            displayName: 'Router',
            children: [null, null],
        }
    }

    function pieceReferencingStepOne(): FlowAction {
        return {
            name: 'step_2',
            type: FlowActionType.PIECE,
            valid: true,
            settings: {
                input: {
                    key: "{{ step_1['output'].id }}",
                    label: 'step_1',
                },
                pieceName: 'store',
                pieceVersion: '0.2.6',
                actionName: 'get',
                propertySettings: {
                    key: { type: PropertyExecutionType.MANUAL },
                    label: { type: PropertyExecutionType.MANUAL },
                },
            },
            displayName: 'Get',
        }
    }

    function firstConditionOf(router: RouterAction): BranchTextCondition {
        const branch = router.settings.branches[0]
        if (branch.branchType !== BranchExecutionType.CONDITION) {
            throw new Error('expected a condition branch')
        }
        return branch.conditions[0][0]
    }

    it('remaps a copied router branch condition to the copied step', () => {
        const flowVersion = flowWith({ secondStep: routerReferencing('step_1') })

        const steps = flowStructureUtil.getAllSteps(paste(flowVersion).trigger)
        const pastedCode = steps.find((step): step is CodeAction => step.type === FlowActionType.CODE && !originalNames.includes(step.name))
        const pastedRouter = steps.find((step): step is RouterAction => step.type === FlowActionType.ROUTER && !originalNames.includes(step.name))
        if (!pastedCode || !pastedRouter) {
            throw new Error('paste did not create the copied steps')
        }
        expect(firstConditionOf(pastedRouter).firstValue).toBe(`{{ ${pastedCode.name}['output'].value }}`)
        expect(firstConditionOf(pastedRouter).firstValue).not.toContain('step_1')
    })

    it('remaps copied loop items to the copied step', () => {
        const flowVersion = flowWith({
            secondStep: {
                name: 'step_2',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: true,
                settings: {
                    items: "{{ step_1['output'].rows }}",
                },
                displayName: 'Loop on Items',
            },
        })

        const steps = flowStructureUtil.getAllSteps(paste(flowVersion).trigger)
        const pastedCode = steps.find((step): step is CodeAction => step.type === FlowActionType.CODE && !originalNames.includes(step.name))
        const pastedLoop = steps.find((step): step is LoopOnItemsAction => step.type === FlowActionType.LOOP_ON_ITEMS && !originalNames.includes(step.name))
        if (!pastedCode || !pastedLoop) {
            throw new Error('paste did not create the copied steps')
        }
        expect(pastedLoop.settings.items).toBe(`{{ ${pastedCode.name}['output'].rows }}`)
        expect(pastedLoop.settings.items).not.toContain('step_1')
    })

    it('remaps a copied piece input reference and leaves bare step-name strings alone', () => {
        const flowVersion = flowWith({ secondStep: pieceReferencingStepOne() })

        const steps = flowStructureUtil.getAllSteps(paste(flowVersion).trigger)
        const pastedCode = steps.find((step): step is CodeAction => step.type === FlowActionType.CODE && !originalNames.includes(step.name))
        const pastedPiece = steps.find((step): step is PieceAction => step.type === FlowActionType.PIECE && !originalNames.includes(step.name))
        if (!pastedCode || !pastedPiece) {
            throw new Error('paste did not create the copied steps')
        }
        expect(pastedPiece.settings.input.key).toBe(`{{ ${pastedCode.name}['output'].id }}`)
        expect(pastedPiece.settings.input.label).toBe('step_1')
    })

    it('leaves a copied code step source untouched while still remapping its neighbours', () => {
        const sourceCode = { code: 'export const code = async (inputs) => `hi {{ step_1 }}` + inputs.step_1', packageJson: '{}' }
        const flowVersion = flowWith({ secondStep: pieceReferencingStepOne(), codeSourceCode: sourceCode })

        const steps = flowStructureUtil.getAllSteps(paste(flowVersion).trigger)
        const pastedCode = steps.find((step): step is CodeAction => step.type === FlowActionType.CODE && !originalNames.includes(step.name))
        const pastedPiece = steps.find((step): step is PieceAction => step.type === FlowActionType.PIECE && !originalNames.includes(step.name))
        if (!pastedCode || !pastedPiece) {
            throw new Error('paste did not create the copied steps')
        }
        expect(pastedCode.settings.sourceCode).toEqual(sourceCode)
        expect(pastedPiece.settings.input.key).toBe(`{{ ${pastedCode.name}['output'].id }}`)
    })

    it('remaps correctly when a pasted step takes over another copied step name', () => {
        const sourceFlow = flowWith({ codeStepName: 'step_2', secondStep: routerReferencing('step_2', 'step_1') })
        const emptyFlow: FlowVersion = { ...sourceFlow, trigger: { ...sourceFlow.trigger, nextAction: undefined } }

        const actions = flowOperations.getActionsForCopy(['step_2', 'step_1'], sourceFlow)
        const operations = flowOperations.getOperationsForPaste(actions, emptyFlow, {
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        })
        const pasted = operations.reduce((flow, operation) => flowOperations.apply(flow, operation), emptyFlow)

        const steps = flowStructureUtil.getAllSteps(pasted.trigger)
        const pastedCode = steps.find((step): step is CodeAction => step.type === FlowActionType.CODE)
        const pastedRouter = steps.find((step): step is RouterAction => step.type === FlowActionType.ROUTER)
        if (!pastedCode || !pastedRouter) {
            throw new Error('paste did not create the copied steps')
        }
        expect(pastedCode.name).toBe('step_1')
        expect(pastedRouter.name).toBe('step_2')
        expect(firstConditionOf(pastedRouter).firstValue).toBe("{{ step_1['output'].value }}")
    })
})
