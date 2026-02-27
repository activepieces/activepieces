import { FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState } from '@activepieces/shared'
import { migrateV17FlattenFlowStructure } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v17-flatten-flow-structure'

describe('migrate-v17-flatten-flow-structure', () => {

    it('should flatten a simple trigger with one action', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Step 1',
                    valid: true,
                    skip: false,
                    settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.schemaVersion).toBe('17')
        expect(result.trigger.steps).toEqual(['step_1'])
        expect(result.steps).toHaveLength(1)
        expect(result.steps[0].name).toBe('step_1')
        expect(result.steps[0].type).toBe(FlowActionType.PIECE)
    })

    it('should flatten a chain of multiple actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.CODE,
                    displayName: 'Code Step',
                    valid: true,
                    skip: false,
                    settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                    nextAction: {
                        name: 'step_2',
                        type: FlowActionType.PIECE,
                        displayName: 'Piece Step',
                        valid: true,
                        skip: false,
                        settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                    },
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.trigger.steps).toEqual(['step_1', 'step_2'])
        expect(result.steps).toHaveLength(2)
        expect(result.steps[0].name).toBe('step_1')
        expect(result.steps[1].name).toBe('step_2')
    })

    it('should flatten a router action with branches', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'router_1',
                    type: FlowActionType.ROUTER,
                    displayName: 'Router',
                    valid: true,
                    skip: false,
                    settings: {
                        branches: [
                            { branchName: 'Branch 1', branchType: 'CONDITION', conditions: [[]] },
                            { branchName: 'Fallback', branchType: 'FALLBACK' },
                        ],
                        executionType: 'EXECUTE_FIRST_MATCH',
                    },
                    children: [
                        {
                            name: 'branch_1_step',
                            type: FlowActionType.PIECE,
                            displayName: 'Branch 1 Action',
                            valid: true,
                            skip: false,
                            settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                        },
                        {
                            name: 'branch_2_step',
                            type: FlowActionType.CODE,
                            displayName: 'Branch 2 Action',
                            valid: true,
                            skip: false,
                            settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                        },
                    ],
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.trigger.steps).toEqual(['router_1'])
        expect(result.steps).toHaveLength(3)

        const router = result.steps[0]
        expect(router.name).toBe('router_1')
        expect(router.type).toBe(FlowActionType.ROUTER)
        expect(router.branches).toHaveLength(2)
        expect(router.branches![0].steps).toEqual(['branch_1_step'])
        expect(router.branches![1].steps).toEqual(['branch_2_step'])

        // branches should be removed from settings
        expect(router.settings).not.toHaveProperty('branches')

        expect(result.steps[1].name).toBe('branch_1_step')
        expect(result.steps[2].name).toBe('branch_2_step')
    })

    it('should flatten a loop action with children', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    skip: false,
                    settings: { items: '{{trigger.items}}', input: {} },
                    firstLoopAction: {
                        name: 'loop_step_1',
                        type: FlowActionType.PIECE,
                        displayName: 'Loop Action',
                        valid: true,
                        skip: false,
                        settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                        nextAction: {
                            name: 'loop_step_2',
                            type: FlowActionType.CODE,
                            displayName: 'Loop Code',
                            valid: true,
                            skip: false,
                            settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                        },
                    },
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.trigger.steps).toEqual(['loop_1'])
        expect(result.steps).toHaveLength(3)

        const loop = result.steps[0]
        expect(loop.name).toBe('loop_1')
        expect(loop.type).toBe(FlowActionType.LOOP_ON_ITEMS)
        expect(loop.children).toEqual(['loop_step_1', 'loop_step_2'])

        expect(result.steps[1].name).toBe('loop_step_1')
        expect(result.steps[2].name).toBe('loop_step_2')
    })

    it('should handle trigger with no actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.EMPTY,
                displayName: 'Select Trigger',
                valid: false,
                settings: {},
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.schemaVersion).toBe('17')
        expect(result.trigger.steps).toEqual([])
        expect(result.steps).toHaveLength(0)
    })

    it('should handle router with null children', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'router_1',
                    type: FlowActionType.ROUTER,
                    displayName: 'Router',
                    valid: true,
                    skip: false,
                    settings: {
                        branches: [
                            { branchName: 'Branch 1', branchType: 'CONDITION', conditions: [[]] },
                            { branchName: 'Fallback', branchType: 'FALLBACK' },
                        ],
                        executionType: 'EXECUTE_FIRST_MATCH',
                    },
                    children: [null, null],
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        const router = result.steps[0]
        expect(router.branches![0].steps).toEqual([])
        expect(router.branches![1].steps).toEqual([])
        expect(result.steps).toHaveLength(1)
    })

    it('should handle complex nested structure (router inside loop)', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    skip: false,
                    settings: { items: '{{trigger.items}}', input: {} },
                    firstLoopAction: {
                        name: 'router_inside_loop',
                        type: FlowActionType.ROUTER,
                        displayName: 'Router in Loop',
                        valid: true,
                        skip: false,
                        settings: {
                            branches: [
                                { branchName: 'Branch 1', branchType: 'CONDITION', conditions: [[]] },
                            ],
                            executionType: 'EXECUTE_FIRST_MATCH',
                        },
                        children: [
                            {
                                name: 'nested_step',
                                type: FlowActionType.PIECE,
                                displayName: 'Nested Step',
                                valid: true,
                                skip: false,
                                settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                            },
                        ],
                    },
                    nextAction: {
                        name: 'after_loop',
                        type: FlowActionType.PIECE,
                        displayName: 'After Loop',
                        valid: true,
                        skip: false,
                        settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                    },
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.trigger.steps).toEqual(['loop_1', 'after_loop'])
        // loop_1, router_inside_loop, nested_step, after_loop
        expect(result.steps).toHaveLength(4)
        expect(result.steps.map(s => s.name)).toEqual([
            'loop_1',
            'router_inside_loop',
            'nested_step',
            'after_loop',
        ])

        const loop = result.steps.find(s => s.name === 'loop_1')!
        expect(loop.children).toEqual(['router_inside_loop'])

        const router = result.steps.find(s => s.name === 'router_inside_loop')!
        expect(router.branches![0].steps).toEqual(['nested_step'])
    })

    it('should preserve step properties during flattening', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'My Trigger',
                valid: true,
                settings: {
                    pieceName: 'test-piece',
                    pieceVersion: '2.0.0',
                    triggerName: 'on_event',
                    input: { key: 'value' },
                },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'My Action',
                    valid: false,
                    skip: true,
                    settings: {
                        pieceName: 'action-piece',
                        pieceVersion: '3.0.0',
                        actionName: 'do_thing',
                        input: { foo: 'bar' },
                    },
                },
            },
        })

        const result = await migrateV17FlattenFlowStructure.migrate(flowVersion)

        expect(result.trigger.name).toBe('trigger')
        expect(result.trigger.displayName).toBe('My Trigger')
        expect(result.trigger.settings.pieceName).toBe('test-piece')

        const action = result.steps[0]
        expect(action.name).toBe('step_1')
        expect(action.displayName).toBe('My Action')
        expect(action.valid).toBe(false)
        expect(action.skip).toBe(true)
        expect(action.settings.pieceName).toBe('action-piece')
        expect(action.settings.input).toEqual({ foo: 'bar' })
    })
})

function createLegacyFlowVersion(overrides: { trigger: Record<string, unknown> }): FlowVersion {
    return {
        id: 'test-version-id',
        flowId: 'test-flow-id',
        displayName: 'Test Flow',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        updatedBy: 'test-user',
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: '16',
        connectionIds: [],
        agentIds: [],
        notes: [],
        steps: [],
        backupFiles: null,
        trigger: overrides.trigger as unknown as FlowVersion['trigger'],
    }
}
