import { describe, it, expect } from 'vitest'
import {
    BranchExecutionType,
    BranchOperator,
    FlowAction,
    FlowActionType,
    FlowOperationType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    RouterExecutionType,
    StepLocationRelativeToParent,
    flowOperations,
} from '../../src'
import { _getOperationsForPaste } from '../../src/lib/automation/flows/operations/paste-operations'
import { _duplicateBranch } from '../../src/lib/automation/flows/operations/duplicate-step'

function makeFlowVersion(): FlowVersion {
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            valid: true,
            settings: {},
        },
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

describe('duplicate and paste step name remapping', () => {
    describe('_duplicateBranch', () => {
        it('should remap step references inside branch conditions', () => {
            const routerAction: FlowAction = {
                name: 'router_1',
                displayName: 'Router',
                type: FlowActionType.ROUTER,
                valid: true,
                settings: {
                    branches: [
                        {
                            branchName: 'Branch 1',
                            branchType: BranchExecutionType.CONDITION,
                            conditions: [
                                [
                                    {
                                        firstValue: '{{step_1.body}}',
                                        secondValue: '{{step_1.status}}',
                                        operator: BranchOperator.TEXT_CONTAINS,
                                        caseSensitive: false,
                                    },
                                ],
                            ],
                        },
                    ],
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                },
                children: [
                    {
                        name: 'step_1',
                        displayName: 'Code',
                        type: FlowActionType.CODE,
                        valid: true,
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'test',
                                packageJson: '{}',
                            },
                        },
                    },
                ],
            }

            const flowVersion: FlowVersion = {
                ...makeFlowVersion(),
                trigger: {
                    ...makeFlowVersion().trigger,
                    nextAction: routerAction,
                },
            }

            const operations = _duplicateBranch('router_1', 0, flowVersion)
            const addBranchOp = operations.find(op => op.type === FlowOperationType.ADD_BRANCH)
            expect(addBranchOp).toBeDefined()
            const conditions = addBranchOp!.request.conditions
            expect(conditions).toBeDefined()
            expect(conditions[0][0].firstValue).toBe('{{step_2.body}}')
            expect(conditions[0][0].secondValue).toBe('{{step_2.status}}')

            const addActionOp = operations.find(op => op.type === FlowOperationType.ADD_ACTION)
            expect(addActionOp).toBeDefined()
            expect(addActionOp!.request.action.name).toBe('step_2')
        })

        it('should not remap references to steps outside the duplicated branch', () => {
            const routerAction: FlowAction = {
                name: 'router_1',
                displayName: 'Router',
                type: FlowActionType.ROUTER,
                valid: true,
                settings: {
                    branches: [
                        {
                            branchName: 'Branch 1',
                            branchType: BranchExecutionType.CONDITION,
                            conditions: [
                                [
                                    {
                                        firstValue: '{{trigger.body}}',
                                        operator: BranchOperator.EXISTS,
                                    },
                                ],
                            ],
                        },
                    ],
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                },
                children: [
                    {
                        name: 'step_1',
                        displayName: 'Code',
                        type: FlowActionType.CODE,
                        valid: true,
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'test',
                                packageJson: '{}',
                            },
                        },
                    },
                ],
            }

            const flowVersion: FlowVersion = {
                ...makeFlowVersion(),
                trigger: {
                    ...makeFlowVersion().trigger,
                    nextAction: routerAction,
                },
            }

            const operations = _duplicateBranch('router_1', 0, flowVersion)
            const addBranchOp = operations.find(op => op.type === FlowOperationType.ADD_BRANCH)
            expect(addBranchOp!.request.conditions[0][0].firstValue).toBe('{{trigger.body}}')
        })
    })

    describe('_getOperationsForPaste', () => {
        it('should remap step references inside pasted router branch conditions', () => {
            const routerAction: FlowAction = {
                name: 'step_3',
                displayName: 'Router',
                type: FlowActionType.ROUTER,
                valid: true,
                settings: {
                    branches: [
                        {
                            branchName: 'Branch 1',
                            branchType: BranchExecutionType.CONDITION,
                            conditions: [
                                [
                                    {
                                        firstValue: '{{step_4.body}}',
                                        secondValue: 'static',
                                        operator: BranchOperator.TEXT_CONTAINS,
                                        caseSensitive: false,
                                    },
                                ],
                            ],
                        },
                    ],
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                },
                children: [
                    {
                        name: 'step_4',
                        displayName: 'Code',
                        type: FlowActionType.CODE,
                        valid: true,
                        settings: {
                            input: {
                                value: '{{step_3.output}}',
                            },
                            sourceCode: {
                                code: 'test',
                                packageJson: '{}',
                            },
                        },
                    },
                ],
            }

            const flowVersion: FlowVersion = {
                ...makeFlowVersion(),
                trigger: {
                    ...makeFlowVersion().trigger,
                    nextAction: {
                        name: 'existing_step',
                        displayName: 'Existing',
                        type: FlowActionType.CODE,
                        valid: true,
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

            const operations = _getOperationsForPaste(
                [routerAction],
                flowVersion,
                {
                    parentStepName: 'existing_step',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                },
            )

            const addActionOp = operations.find(op => op.type === FlowOperationType.ADD_ACTION)
            expect(addActionOp).toBeDefined()
            const pastedRouter = addActionOp!.request.action
            expect(pastedRouter.type).toBe(FlowActionType.ROUTER)
            expect(pastedRouter.name).toBe('step_1')
            const conditions = pastedRouter.settings.branches[0].conditions
            expect(conditions[0][0].firstValue).toBe('{{step_2.body}}')
            expect(pastedRouter.children[0].name).toBe('step_2')
            expect(pastedRouter.children[0].settings.input.value).toBe('{{step_1.output}}')
        })
    })

    describe('regression: both input and conditions remapped together', () => {
        it('should remap conditions and inputs when duplicating a branch', () => {
            const routerAction: FlowAction = {
                name: 'router_1',
                displayName: 'Router',
                type: FlowActionType.ROUTER,
                valid: true,
                settings: {
                    branches: [
                        {
                            branchName: 'Branch 1',
                            branchType: BranchExecutionType.CONDITION,
                            conditions: [
                                [
                                    {
                                        firstValue: '{{step_1.body}}',
                                        secondValue: '{{step_1.status}}',
                                        operator: BranchOperator.TEXT_CONTAINS,
                                        caseSensitive: false,
                                    },
                                ],
                            ],
                        },
                    ],
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                },
                children: [
                    {
                        name: 'step_1',
                        displayName: 'Code',
                        type: FlowActionType.CODE,
                        valid: true,
                        settings: {
                            input: {
                                ref: '{{step_1.nested}}',
                            },
                            sourceCode: {
                                code: 'test',
                                packageJson: '{}',
                            },
                        },
                    },
                ],
            }

            const flowVersion: FlowVersion = {
                ...makeFlowVersion(),
                trigger: {
                    ...makeFlowVersion().trigger,
                    nextAction: routerAction,
                },
            }

            const result = flowOperations.apply(flowVersion, {
                type: FlowOperationType.DUPLICATE_BRANCH,
                request: {
                    stepName: 'router_1',
                    branchIndex: 0,
                },
            })

            const router = result.trigger.nextAction
            expect(router.type).toBe(FlowActionType.ROUTER)
            expect(router.settings.branches).toHaveLength(2)

            const duplicatedBranch = router.settings.branches[1]
            expect(duplicatedBranch.conditions[0][0].firstValue).toBe('{{step_2.body}}')
            expect(duplicatedBranch.conditions[0][0].secondValue).toBe('{{step_2.status}}')

            const duplicatedChild = router.children[1]
            expect(duplicatedChild!.name).toBe('step_2')
            expect(duplicatedChild!.settings.input.ref).toBe('{{step_2.nested}}')
        })

        it('should remap conditions and inputs when duplicating a router step', () => {
            const routerAction: FlowAction = {
                name: 'router_1',
                displayName: 'Router',
                type: FlowActionType.ROUTER,
                valid: true,
                settings: {
                    branches: [
                        {
                            branchName: 'Branch 1',
                            branchType: BranchExecutionType.CONDITION,
                            conditions: [
                                [
                                    {
                                        firstValue: '{{step_1.body}}',
                                        operator: BranchOperator.TEXT_CONTAINS,
                                        caseSensitive: false,
                                    },
                                ],
                            ],
                        },
                    ],
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                },
                children: [
                    {
                        name: 'step_1',
                        displayName: 'Code',
                        type: FlowActionType.CODE,
                        valid: true,
                        settings: {
                            input: {
                                ref: '{{step_1.nested}}',
                            },
                            sourceCode: {
                                code: 'test',
                                packageJson: '{}',
                            },
                        },
                    },
                ],
            }

            const flowVersion: FlowVersion = {
                ...makeFlowVersion(),
                trigger: {
                    ...makeFlowVersion().trigger,
                    nextAction: routerAction,
                },
            }

            const result = flowOperations.apply(flowVersion, {
                type: FlowOperationType.DUPLICATE_ACTION,
                request: {
                    stepName: 'router_1',
                },
            })

            const originalRouter = result.trigger.nextAction
            const duplicatedRouter = originalRouter.nextAction
            expect(duplicatedRouter.type).toBe(FlowActionType.ROUTER)
            expect(duplicatedRouter.name).toBe('step_2')
            expect(duplicatedRouter.settings.branches[0].conditions[0][0].firstValue).toBe('{{step_3.body}}')
            expect(duplicatedRouter.children[0].name).toBe('step_3')
            expect(duplicatedRouter.children[0].settings.input.ref).toBe('{{step_3.nested}}')
        })
    })
})
