import { BranchEdge, FlowActionKind, FlowTriggerKind, FlowVersion, FlowVersionState } from '@activepieces/shared'
import { migrateV17ToGraph } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v17-to-graph'

describe('migrate-v17-to-graph', () => {

    it('should convert a simple trigger with one action to graph', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionKind.PIECE,
                    displayName: 'Step 1',
                    valid: true,
                    skip: false,
                    settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                },
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        expect(result.schemaVersion).toBe('17')
        expect(result.graph.nodes).toHaveLength(2)
        expect(result.graph.edges).toHaveLength(1)

        const triggerNode = result.graph.nodes.find(n => n.type === 'trigger')!
        expect(triggerNode.id).toBe('trigger')
        expect(triggerNode.data.kind).toBe(FlowTriggerKind.PIECE)

        const actionNode = result.graph.nodes.find(n => n.id === 'step_1')!
        expect(actionNode.type).toBe('action')
        expect(actionNode.data.kind).toBe(FlowActionKind.PIECE)

        expect(result.graph.edges[0]).toMatchObject({
            source: 'trigger',
            target: 'step_1',
            type: 'default',
        })
    })

    it('should convert a chain of multiple actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionKind.CODE,
                    displayName: 'Code Step',
                    valid: true,
                    skip: false,
                    settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                    nextAction: {
                        name: 'step_2',
                        type: FlowActionKind.PIECE,
                        displayName: 'Piece Step',
                        valid: true,
                        skip: false,
                        settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                    },
                },
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        expect(result.graph.nodes).toHaveLength(3)
        expect(result.graph.edges).toHaveLength(2)

        const nodeIds = result.graph.nodes.map(n => n.id)
        expect(nodeIds).toEqual(['trigger', 'step_1', 'step_2'])

        expect(result.graph.edges[0]).toMatchObject({ source: 'trigger', target: 'step_1', type: 'default' })
        expect(result.graph.edges[1]).toMatchObject({ source: 'step_1', target: 'step_2', type: 'default' })
    })

    it('should convert a router action with branches to graph edges', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'router_1',
                    type: FlowActionKind.ROUTER,
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
                            type: FlowActionKind.PIECE,
                            displayName: 'Branch 1 Action',
                            valid: true,
                            skip: false,
                            settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                        },
                        {
                            name: 'branch_2_step',
                            type: FlowActionKind.CODE,
                            displayName: 'Branch 2 Action',
                            valid: true,
                            skip: false,
                            settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                        },
                    ],
                },
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        // 4 nodes: trigger, router_1, branch_1_step, branch_2_step
        expect(result.graph.nodes).toHaveLength(4)

        const routerNode = result.graph.nodes.find(n => n.id === 'router_1')!
        expect(routerNode.data.kind).toBe(FlowActionKind.ROUTER)
        // branches should be removed from settings
        expect(routerNode.data.settings).not.toHaveProperty('branches')

        // Check branch edges
        const branchEdges = result.graph.edges.filter(e => e.type === 'branch')
        expect(branchEdges).toHaveLength(2)
        expect(branchEdges[0]).toMatchObject({
            source: 'router_1',
            target: 'branch_1_step',
            branchIndex: 0,
            branchName: 'Branch 1',
        })
        expect(branchEdges[1]).toMatchObject({
            source: 'router_1',
            target: 'branch_2_step',
            branchIndex: 1,
            branchName: 'Fallback',
        })
    })

    it('should preserve branch conditions during conversion', async () => {
        const conditions = [
            [
                { operator: 'BOOLEAN_IS_FALSE', firstValue: '{{step_1.free_email}}' },
                { operator: 'EXISTS', firstValue: '{{step_1.domain}}' },
            ],
        ]
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'router_1',
                    type: FlowActionKind.ROUTER,
                    displayName: 'Router',
                    valid: true,
                    skip: false,
                    settings: {
                        branches: [
                            { branchName: 'Has Domain', branchType: 'CONDITION', conditions },
                            { branchName: 'Otherwise', branchType: 'FALLBACK' },
                        ],
                        executionType: 'EXECUTE_FIRST_MATCH',
                    },
                    children: [
                        {
                            name: 'step_a',
                            type: FlowActionKind.PIECE,
                            displayName: 'Step A',
                            valid: true,
                            skip: false,
                            settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                        },
                        null,
                    ],
                },
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        const branchEdges = result.graph.edges
            .filter((e): e is BranchEdge => e.type === 'branch')
            .sort((a, b) => a.branchIndex - b.branchIndex)

        expect(branchEdges).toHaveLength(2)

        // First branch should have conditions preserved
        expect(branchEdges[0]).toMatchObject({
            source: 'router_1',
            target: 'step_a',
            branchIndex: 0,
            branchName: 'Has Domain',
            branchType: 'CONDITION',
            conditions,
        })

        // Fallback branch should have no conditions
        expect(branchEdges[1]).toMatchObject({
            source: 'router_1',
            target: null,
            branchIndex: 1,
            branchName: 'Otherwise',
            branchType: 'FALLBACK',
        })
        expect(branchEdges[1]).not.toHaveProperty('conditions')
    })

    it('should convert a loop action with children to graph edges', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'loop_1',
                    type: FlowActionKind.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    skip: false,
                    settings: { items: '{{trigger.items}}', input: {} },
                    firstLoopAction: {
                        name: 'loop_step_1',
                        type: FlowActionKind.PIECE,
                        displayName: 'Loop Action',
                        valid: true,
                        skip: false,
                        settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                        nextAction: {
                            name: 'loop_step_2',
                            type: FlowActionKind.CODE,
                            displayName: 'Loop Code',
                            valid: true,
                            skip: false,
                            settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                        },
                    },
                },
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        // 4 nodes: trigger, loop_1, loop_step_1, loop_step_2
        expect(result.graph.nodes).toHaveLength(4)

        const loopNode = result.graph.nodes.find(n => n.id === 'loop_1')!
        expect(loopNode.data.kind).toBe(FlowActionKind.LOOP_ON_ITEMS)

        // Check loop edge
        const loopEdge = result.graph.edges.find(e => e.type === 'loop')!
        expect(loopEdge).toMatchObject({
            source: 'loop_1',
            target: 'loop_step_1',
        })

        // Check chain inside loop
        const defaultEdgeInsideLoop = result.graph.edges.find(
            e => e.type === 'default' && e.source === 'loop_step_1',
        )!
        expect(defaultEdgeInsideLoop.target).toBe('loop_step_2')
    })

    it('should handle trigger with no actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.EMPTY,
                displayName: 'Select Trigger',
                valid: false,
                settings: {},
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        expect(result.schemaVersion).toBe('17')
        expect(result.graph.nodes).toHaveLength(1)
        expect(result.graph.nodes[0].data.kind).toBe(FlowTriggerKind.EMPTY)
        expect(result.graph.edges).toHaveLength(0)
    })

    it('should handle router with null children', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'router_1',
                    type: FlowActionKind.ROUTER,
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

        const result = await migrateV17ToGraph.migrate(flowVersion)

        const branchEdges = result.graph.edges.filter(e => e.type === 'branch')
        expect(branchEdges[0].target).toBeNull()
        expect(branchEdges[1].target).toBeNull()
        // Only trigger and router nodes (no branch children)
        expect(result.graph.nodes).toHaveLength(2)
    })

    it('should handle complex nested structure (router inside loop)', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'loop_1',
                    type: FlowActionKind.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    skip: false,
                    settings: { items: '{{trigger.items}}', input: {} },
                    firstLoopAction: {
                        name: 'router_inside_loop',
                        type: FlowActionKind.ROUTER,
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
                                type: FlowActionKind.PIECE,
                                displayName: 'Nested Step',
                                valid: true,
                                skip: false,
                                settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                            },
                        ],
                    },
                    nextAction: {
                        name: 'after_loop',
                        type: FlowActionKind.PIECE,
                        displayName: 'After Loop',
                        valid: true,
                        skip: false,
                        settings: { pieceName: 'test', pieceVersion: '1.0.0', actionName: 'test', input: {} },
                    },
                },
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        // 5 nodes: trigger, loop_1, router_inside_loop, nested_step, after_loop
        expect(result.graph.nodes).toHaveLength(5)
        const nodeIds = result.graph.nodes.map(n => n.id)
        expect(nodeIds).toContain('trigger')
        expect(nodeIds).toContain('loop_1')
        expect(nodeIds).toContain('router_inside_loop')
        expect(nodeIds).toContain('nested_step')
        expect(nodeIds).toContain('after_loop')

        // trigger -> loop_1 (default)
        expect(result.graph.edges).toContainEqual(expect.objectContaining({
            source: 'trigger', target: 'loop_1', type: 'default',
        }))
        // loop_1 -> router_inside_loop (loop edge)
        expect(result.graph.edges).toContainEqual(expect.objectContaining({
            source: 'loop_1', target: 'router_inside_loop', type: 'loop',
        }))
        // router_inside_loop -> nested_step (branch edge)
        expect(result.graph.edges).toContainEqual(expect.objectContaining({
            source: 'router_inside_loop', target: 'nested_step', type: 'branch',
        }))
        // loop_1 -> after_loop (default)
        expect(result.graph.edges).toContainEqual(expect.objectContaining({
            source: 'loop_1', target: 'after_loop', type: 'default',
        }))
    })

    it('should preserve step properties during conversion', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.PIECE,
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
                    type: FlowActionKind.PIECE,
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

        const result = await migrateV17ToGraph.migrate(flowVersion)

        const triggerNode = result.graph.nodes.find(n => n.id === 'trigger')!
        expect(triggerNode.data.displayName).toBe('My Trigger')
        expect((triggerNode.data.settings as Record<string, unknown>).pieceName).toBe('test-piece')

        const actionNode = result.graph.nodes.find(n => n.id === 'step_1')!
        expect(actionNode.data.displayName).toBe('My Action')
        expect(actionNode.data.valid).toBe(false)
        expect((actionNode.data as Record<string, unknown>).skip).toBe(true)
        expect((actionNode.data.settings as Record<string, unknown>).pieceName).toBe('action-piece')
        expect((actionNode.data.settings as Record<string, unknown>).input).toEqual({ foo: 'bar' })
    })

    it('should remove trigger and steps properties from the result', async () => {
        const flowVersion = createLegacyFlowVersion({
            trigger: {
                name: 'trigger',
                type: FlowTriggerKind.EMPTY,
                displayName: 'Select Trigger',
                valid: false,
                settings: {},
            },
        })

        const result = await migrateV17ToGraph.migrate(flowVersion)

        expect(result).not.toHaveProperty('trigger')
        expect(result).not.toHaveProperty('steps')
        expect(result).toHaveProperty('graph')
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
        backupFiles: null,
        trigger: overrides.trigger,
    } as unknown as FlowVersion
}
