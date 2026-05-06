import {
    BranchOperator,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV20StepOutputNesting } from '../../../../../src/app/flows/flow-version/migrations/migrate-v20-step-output-nesting'

const baseVersion = (trigger: FlowVersion['trigger']): FlowVersion => ({
    id: 'fv-1',
    displayName: 'fixture',
    flowId: 'flow-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    updatedBy: null,
    valid: true,
    trigger,
    state: FlowVersionState.DRAFT,
    schemaVersion: '20',
    connectionIds: [],
    agentIds: [],
    notes: [],
})

const triggerWithNoNext = (overrides: Partial<FlowVersion['trigger']['settings']> = {}): FlowVersion['trigger'] => ({
    type: FlowTriggerType.PIECE,
    name: 'trigger',
    displayName: 'Trigger',
    valid: true,
    lastUpdatedDate: new Date().toISOString(),
    settings: {
        pieceName: '@activepieces/piece-webhook',
        pieceVersion: '0.0.1',
        triggerName: 'catch_request',
        input: {},
        propertySettings: {},
        ...overrides,
    },
})

describe('migrateV20StepOutputNesting', () => {
    describe('O. walkSettings — every settings path is traversed', () => {
        it('O1. top-level input field is rewritten', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.PIECE,
                    name: 'step_1',
                    displayName: 'Step 1',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        pieceName: '@activepieces/piece-test',
                        pieceVersion: '0.0.1',
                        actionName: 'do',
                        input: { field: '{{step_1.foo}}' },
                        propertySettings: {},
                    },
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const next = result.trigger.nextAction
            expect(next?.settings.input.field).toBe('{{step_1[\'output\'].foo}}')
            expect(result.schemaVersion).toBe('21')
        })

        it('O2. nested input fields are rewritten', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.PIECE,
                    name: 'step_1',
                    displayName: 'Step 1',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        pieceName: '@activepieces/piece-test',
                        pieceVersion: '0.0.1',
                        actionName: 'do',
                        input: {
                            headers: { Authorization: '{{step_1.token}}' },
                        },
                        propertySettings: {},
                    },
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const next = result.trigger.nextAction
            expect(next?.settings.input.headers.Authorization).toBe('{{step_1[\'output\'].token}}')
        })

        it('O3. array of expressions — each rewritten', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.PIECE,
                    name: 'step_1',
                    displayName: 'Step 1',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        pieceName: '@activepieces/piece-test',
                        pieceVersion: '0.0.1',
                        actionName: 'do',
                        input: { tags: ['{{step_1.tag1}}', '{{step_2.tag2}}'] },
                        propertySettings: {},
                    },
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const next = result.trigger.nextAction
            expect(next?.settings.input.tags).toEqual([
                '{{step_1[\'output\'].tag1}}',
                '{{step_2[\'output\'].tag2}}',
            ])
        })

        it('O4-O7. router branch conditions — firstValue and secondValue both rewritten across multi-group nesting', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.ROUTER,
                    name: 'router_1',
                    displayName: 'Router',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        branches: [
                            {
                                branchName: 'branch_a',
                                branchType: 'CONDITION',
                                conditions: [
                                    [
                                        {
                                            firstValue: '{{step_1.amount}}',
                                            secondValue: '{{step_2.threshold}}',
                                            operator: BranchOperator.NUMBER_IS_GREATER_THAN,
                                            caseSensitive: false,
                                        },
                                        {
                                            firstValue: '{{step_3.x}}',
                                            secondValue: '0',
                                            operator: BranchOperator.NUMBER_IS_EQUAL_TO,
                                            caseSensitive: false,
                                        },
                                    ],
                                    [
                                        {
                                            firstValue: '{{step_4.y}}',
                                            secondValue: '{{step_5.z}}',
                                            operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                                            caseSensitive: true,
                                        },
                                    ],
                                ],
                            } as never,
                        ],
                        executionType: 'EXECUTE_FIRST_MATCH',
                        inputUiInfo: {},
                    } as never,
                    children: [null],
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const router = result.trigger.nextAction as never as { settings: { branches: Array<{ conditions: Array<Array<{ firstValue: string, secondValue: string }>> }> } }
            const conditions = router.settings.branches[0].conditions
            expect(conditions[0][0].firstValue).toBe('{{step_1[\'output\'].amount}}')
            expect(conditions[0][0].secondValue).toBe('{{step_2[\'output\'].threshold}}')
            expect(conditions[0][1].firstValue).toBe('{{step_3[\'output\'].x}}')
            expect(conditions[0][1].secondValue).toBe('0')
            expect(conditions[1][0].firstValue).toBe('{{step_4[\'output\'].y}}')
            expect(conditions[1][0].secondValue).toBe('{{step_5[\'output\'].z}}')
        })

        it('O8. loop iterator items — rewritten', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.LOOP_ON_ITEMS,
                    name: 'step_3',
                    displayName: 'Loop',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        items: '{{step_1.list}}',
                        inputUiInfo: {},
                    } as never,
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const loop = result.trigger.nextAction as never as { settings: { items: string } }
            expect(loop.settings.items).toBe('{{step_1[\'output\'].list}}')
        })

        it('O9. continueOnFailureBranches recursion — onSuccess/onFailure subtree migrated', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.CODE,
                    name: 'step_1',
                    displayName: 'Code',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        sourceCode: { code: '', packageJson: '{}' },
                        input: {},
                        errorHandlingOptions: {
                            continueOnFailure: { value: true },
                            continueOnFailureBranches: {
                                onSuccess: {
                                    type: FlowActionType.PIECE,
                                    name: 'step_2',
                                    displayName: 'Step 2',
                                    skip: false,
                                    valid: true,
                                    lastUpdatedDate: new Date().toISOString(),
                                    settings: {
                                        pieceName: '@activepieces/piece-test',
                                        pieceVersion: '0.0.1',
                                        actionName: 'do',
                                        input: { value: '{{step_1.foo}}' },
                                        propertySettings: {},
                                    },
                                },
                                onFailure: {
                                    type: FlowActionType.PIECE,
                                    name: 'step_3',
                                    displayName: 'Step 3',
                                    skip: false,
                                    valid: true,
                                    lastUpdatedDate: new Date().toISOString(),
                                    settings: {
                                        pieceName: '@activepieces/piece-test',
                                        pieceVersion: '0.0.1',
                                        actionName: 'do',
                                        input: { error: '{{step_1.error.message}}' },
                                        propertySettings: {},
                                    },
                                },
                            },
                        },
                    },
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const head = result.trigger.nextAction as never as {
                settings: {
                    errorHandlingOptions: {
                        continueOnFailureBranches: {
                            onSuccess: { settings: { input: { value: string } } }
                            onFailure: { settings: { input: { error: string } } }
                        }
                    }
                }
            }
            const branches = head.settings.errorHandlingOptions.continueOnFailureBranches
            expect(branches.onSuccess.settings.input.value).toBe('{{step_1[\'output\'].foo}}')
            expect(branches.onFailure.settings.input.error).toBe('{{step_1[\'output\'].error.message}}')
        })

        it('O10. trigger settings input is rewritten', async () => {
            const version = baseVersion(triggerWithNoNext({
                input: { topic: '{{trigger.event}}' },
            }))
            const result = await migrateV20StepOutputNesting.migrate(version)
            expect(result.trigger.settings.input.topic).toBe('{{trigger[\'output\'].event}}')
        })

        it('O11. code step source code is NOT rewritten (no {{...}} tokens)', async () => {
            const sourceCode = 'function run() { const step_1 = inputs.step_1; return step_1; }'
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.CODE,
                    name: 'step_1',
                    displayName: 'Code',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        sourceCode: { code: sourceCode, packageJson: '{}' },
                        input: {},
                    },
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const code = result.trigger.nextAction as never as { settings: { sourceCode: { code: string } } }
            expect(code.settings.sourceCode.code).toBe(sourceCode)
        })
    })

    describe('P. migration-level integration', () => {
        it('P3. schemaVersion gating — only triggers on version 20', () => {
            expect(migrateV20StepOutputNesting.targetSchemaVersion).toBe('20')
        })

        it('P1. round-trip preserves non-expression fields and rewrites expressions', async () => {
            const version = baseVersion({
                ...triggerWithNoNext(),
                nextAction: {
                    type: FlowActionType.PIECE,
                    name: 'step_1',
                    displayName: 'Step 1',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        pieceName: '@activepieces/piece-test',
                        pieceVersion: '0.0.1',
                        actionName: 'do',
                        input: { field: '{{step_1.foo}}', literal: 'unchanged', count: 42 },
                        propertySettings: {},
                    },
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            const next = result.trigger.nextAction
            expect(next?.settings.input.field).toBe('{{step_1[\'output\'].foo}}')
            expect(next?.settings.input.literal).toBe('unchanged')
            expect(next?.settings.input.count).toBe(42)
            expect(result.id).toBe(version.id)
            expect(result.flowId).toBe(version.flowId)
            expect(result.displayName).toBe(version.displayName)
        })

        it('P5. multi-step flow with nested router and continueOnFailureBranches', async () => {
            const version = baseVersion({
                ...triggerWithNoNext({ input: { src: '{{trigger.body}}' } }),
                nextAction: {
                    type: FlowActionType.ROUTER,
                    name: 'router_1',
                    displayName: 'Router',
                    skip: false,
                    valid: true,
                    lastUpdatedDate: new Date().toISOString(),
                    settings: {
                        branches: [
                            {
                                branchName: 'b',
                                branchType: 'CONDITION',
                                conditions: [[{
                                    firstValue: '{{step_1.x}}',
                                    secondValue: '5',
                                    operator: BranchOperator.NUMBER_IS_EQUAL_TO,
                                    caseSensitive: false,
                                }]],
                            } as never,
                        ],
                        executionType: 'EXECUTE_FIRST_MATCH',
                        inputUiInfo: {},
                    } as never,
                    children: [
                        {
                            type: FlowActionType.PIECE,
                            name: 'step_1',
                            displayName: 'Step 1',
                            skip: false,
                            valid: true,
                            lastUpdatedDate: new Date().toISOString(),
                            settings: {
                                pieceName: '@activepieces/piece-test',
                                pieceVersion: '0.0.1',
                                actionName: 'do',
                                input: { field: '{{trigger.body.id}}' },
                                propertySettings: {},
                            },
                        },
                    ],
                },
            })
            const result = await migrateV20StepOutputNesting.migrate(version)
            expect(result.trigger.settings.input.src).toBe('{{trigger[\'output\'].body}}')
            const router = result.trigger.nextAction as never as {
                settings: { branches: Array<{ conditions: Array<Array<{ firstValue: string }>> }> }
                children: Array<{ settings: { input: { field: string } } }>
            }
            expect(router.settings.branches[0].conditions[0][0].firstValue).toBe('{{step_1[\'output\'].x}}')
            expect(router.children[0].settings.input.field).toBe('{{trigger[\'output\'].body.id}}')
        })
    })
})
