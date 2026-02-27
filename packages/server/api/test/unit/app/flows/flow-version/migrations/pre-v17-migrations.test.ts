import {
    AgentPieceProps,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    BranchExecutionType,
    RouterExecutionType,
} from '@activepieces/shared'
import { migrateBranchToRouter } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v0-branch-to-router'
import { migrateConnectionIds } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v1-connection-ids'
import { migrateAgentPieceV2 } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v2-agent-piece'
import { migrateAgentPieceV3 } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v3-agent-piece'
import { migrateAgentPieceV4 } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v4-agent-piece'
import { migrateHttpToWebhookV5 } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v5-http-to-webhook'
import { migratePropertySettingsV6 } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v6-property-settings'
import { cleanUpAgentTools } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v8-agent-tools'
import { migrateV10AiPiecesProviderId } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v10-ai-pieces-provider-id'
import { migrateV13AddNotes } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v13-add-notes'
import { migrateV14AgentProviderModel } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v14-agent-provider-model'
import { migrateV15AgentProviderModel } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v15-agent-provider-model'

describe('migrate-v0-branch-to-router', () => {

    it('should convert BRANCH action to ROUTER', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: undefined,
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: 'BRANCH',
                    displayName: 'Branch',
                    valid: true,
                    settings: {
                        conditions: [[{ operator: 'TEXT_CONTAINS', firstValue: '{{trigger.val}}', secondValue: 'x', caseSensitive: false }]],
                    },
                    onSuccessAction: {
                        name: 'step_2',
                        type: FlowActionType.CODE,
                        displayName: 'On Success',
                        valid: true,
                        settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                    },
                    onFailureAction: {
                        name: 'step_3',
                        type: FlowActionType.CODE,
                        displayName: 'On Failure',
                        valid: true,
                        settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                    },
                },
            },
        })

        const result = await migrateBranchToRouter.migrate(flowVersion)

        expect(result.schemaVersion).toBe('1')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const router = trigger.nextAction as Record<string, unknown>
        expect(router.type).toBe(FlowActionType.ROUTER)
        expect(router.name).toBe('step_1')
        const settings = router.settings as Record<string, unknown>
        const branches = settings.branches as Record<string, unknown>[]
        expect(branches).toHaveLength(2)
        expect(branches[0].branchType).toBe(BranchExecutionType.CONDITION)
        expect(branches[1].branchType).toBe(BranchExecutionType.FALLBACK)
        expect(settings.executionType).toBe(RouterExecutionType.EXECUTE_FIRST_MATCH)
        const children = router.children as Record<string, unknown>[]
        expect(children).toHaveLength(2)
        expect((children[0] as Record<string, unknown>).name).toBe('step_2')
        expect((children[1] as Record<string, unknown>).name).toBe('step_3')
    })

    it('should handle BRANCH with null success/failure actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: undefined,
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: 'BRANCH',
                    displayName: 'Branch',
                    valid: true,
                    settings: { conditions: [[]] },
                },
            },
        })

        const result = await migrateBranchToRouter.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const router = trigger.nextAction as Record<string, unknown>
        const children = router.children as (Record<string, unknown> | null)[]
        expect(children[0]).toBeNull()
        expect(children[1]).toBeNull()
    })

    it('should not modify non-BRANCH actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: undefined,
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.CODE,
                    displayName: 'Code',
                    valid: true,
                    settings: { sourceCode: { code: 'test', packageJson: '{}' }, input: {} },
                },
            },
        })

        const result = await migrateBranchToRouter.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect(step.type).toBe(FlowActionType.CODE)
    })
})

describe('migrate-v1-connection-ids', () => {

    it('should extract connection IDs from trigger auth', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '1',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: { auth: "{{connections['conn-123']}}" } },
            },
        })

        const result = await migrateConnectionIds.migrate(flowVersion)

        expect(result.schemaVersion).toBe('2')
        expect(result.connectionIds).toContain('conn-123')
    })

    it('should extract connection IDs from action auth', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '1',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Gmail',
                    valid: true,
                    settings: { pieceName: 'gmail', pieceVersion: '1.0.0', actionName: 'send', input: { auth: "{{connections['gmail-abc']}}" } },
                },
            },
        })

        const result = await migrateConnectionIds.migrate(flowVersion)

        expect(result.connectionIds).toContain('gmail-abc')
    })

    it('should return empty array when no connections exist', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '1',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
            },
        })

        const result = await migrateConnectionIds.migrate(flowVersion)

        expect(result.connectionIds).toEqual([])
    })
})

describe('migrate-v2-agent-piece', () => {

    it('should pin agent piece to version 0.2.0', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '2',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Agent',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-agent', pieceVersion: '0.1.0', actionName: 'run', input: {} },
                },
            },
        })

        const result = await migrateAgentPieceV2.migrate(flowVersion)

        expect(result.schemaVersion).toBe('3')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceVersion).toBe('0.2.0')
    })

    it('should not modify non-agent pieces', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '2',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Gmail',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.5.0', actionName: 'send', input: {} },
                },
            },
        })

        const result = await migrateAgentPieceV2.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceVersion).toBe('0.5.0')
    })
})

describe('migrate-v3-agent-piece', () => {

    it('should pin agent piece to version 0.2.2', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '3',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Agent',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-agent', pieceVersion: '0.2.0', actionName: 'run', input: {} },
                },
            },
        })

        const result = await migrateAgentPieceV3.migrate(flowVersion)

        expect(result.schemaVersion).toBe('4')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceVersion).toBe('0.2.2')
    })
})

describe('migrate-v4-agent-piece', () => {

    it('should pin agent piece to 0.2.4 and extract agentIds', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '4',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-ai', pieceVersion: '0.0.1', actionName: 'run', input: { agentId: 'agent-xyz' } },
                },
            },
        })

        const result = await migrateAgentPieceV4.migrate(flowVersion)

        expect(result.schemaVersion).toBe('5')
        expect(result.agentIds).toContain('agent-xyz')
    })

    it('should return empty agentIds when no AI pieces', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '4',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.CODE,
                    displayName: 'Code',
                    valid: true,
                    settings: { sourceCode: { code: '', packageJson: '' }, input: {} },
                },
            },
        })

        const result = await migrateAgentPieceV4.migrate(flowVersion)

        expect(result.agentIds).toEqual([])
    })
})

describe('migrate-v5-http-to-webhook', () => {

    it('should convert HTTP return_response to webhook piece', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '5',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'HTTP Response',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-http',
                        pieceVersion: '0.5.0',
                        actionName: 'return_response',
                        input: {
                            body: { data: '{"ok":true}' },
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                            body_type: 'json',
                        },
                        propertySettings: {},
                    },
                },
            },
        })

        const result = await migrateHttpToWebhookV5.migrate(flowVersion)

        expect(result.schemaVersion).toBe('6')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const settings = step.settings as Record<string, unknown>
        expect(settings.pieceName).toBe('@activepieces/piece-webhook')
        expect(settings.pieceVersion).toBe('0.1.20')
        expect(settings.actionName).toBe('return_response')
        const input = settings.input as Record<string, unknown>
        expect(input.respond).toBe('stop')
        expect(input.responseType).toBe('json')
        const fields = input.fields as Record<string, unknown>
        expect(fields.body).toBe('{"ok":true}')
        expect(fields.status).toBe(200)
    })

    it('should handle HTTP version < 0.5.0 body format', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '5',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'HTTP Response',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-http',
                        pieceVersion: '0.4.0',
                        actionName: 'return_response',
                        input: {
                            body: { key: 'value' },
                            status: 201,
                        },
                        propertySettings: {},
                    },
                },
            },
        })

        const result = await migrateHttpToWebhookV5.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const settings = step.settings as Record<string, unknown>
        const input = settings.input as Record<string, unknown>
        const fields = input.fields as Record<string, unknown>
        expect(fields.body).toEqual({ key: 'value' })
    })

    it('should not modify non-HTTP pieces', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '5',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Gmail',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.5.0', actionName: 'send', input: {} },
                },
            },
        })

        const result = await migrateHttpToWebhookV5.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceName).toBe('@activepieces/piece-gmail')
    })
})

describe('migrate-v6-property-settings', () => {

    it('should migrate inputUiInfo to sampleDataSettings and propertySettings', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '6',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: {
                    pieceName: 'test',
                    pieceVersion: '1.0.0',
                    triggerName: 'test',
                    input: { to: 'user@example.com', subject: 'Hello' },
                    inputUiInfo: {
                        sampleDataFileId: 'file-1',
                        sampleDataInputFileId: 'file-2',
                        lastTestDate: '2024-01-01',
                        customizedInputs: { to: true },
                    },
                    schema: { to: { type: 'string' } },
                },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.CODE,
                    displayName: 'Code',
                    valid: true,
                    settings: { sourceCode: { code: '', packageJson: '' }, input: { code: 'x' } },
                },
            },
        })

        const result = await migratePropertySettingsV6.migrate(flowVersion)

        expect(result.schemaVersion).toBe('7')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const triggerSettings = trigger.settings as Record<string, unknown>
        const sampleDataSettings = triggerSettings.sampleDataSettings as Record<string, unknown>
        expect(sampleDataSettings.sampleDataFileId).toBe('file-1')
        expect(sampleDataSettings.sampleDataInputFileId).toBe('file-2')
        expect(sampleDataSettings.lastTestDate).toBe('2024-01-01')
        const propertySettings = triggerSettings.propertySettings as Record<string, Record<string, unknown>>
        expect(propertySettings.to.type).toBe(PropertyExecutionType.DYNAMIC)
        expect(propertySettings.subject.type).toBe(PropertyExecutionType.MANUAL)
        expect(triggerSettings.inputUiInfo).toBeUndefined()
    })
})

describe('migrate-v8-agent-tools', () => {

    it('should clean up PIECE tool format with connection template', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '8',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Agent',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-agent',
                        pieceVersion: '0.3.0',
                        actionName: 'run',
                        input: {
                            agentTools: [
                                {
                                    type: 'PIECE',
                                    toolName: 'send_email',
                                    pieceMetadata: {
                                        pieceName: '@activepieces/piece-gmail',
                                        pieceVersion: '0.5.0',
                                        actionName: 'send_email',
                                        connectionExternalId: 'gmail-conn-1',
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        })

        const result = await cleanUpAgentTools.migrate(flowVersion)

        expect(result.schemaVersion).toBe('9')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const settings = step.settings as Record<string, unknown>
        expect(settings.pieceVersion).toBe('0.3.7')
        const input = settings.input as Record<string, unknown>
        const tools = input[AgentPieceProps.AGENT_TOOLS] as Record<string, unknown>[]
        expect(tools).toHaveLength(1)
        expect(tools[0].type).toBe('PIECE')
        const pm = tools[0].pieceMetadata as Record<string, unknown>
        expect(pm.pieceName).toBe('@activepieces/piece-gmail')
        expect((pm.predefinedInput as Record<string, unknown>).auth).toBe("{{connections['gmail-conn-1']}}")
    })

    it('should clean up FLOW tool format', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '8',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'Agent',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-agent',
                        pieceVersion: '0.3.0',
                        actionName: 'run',
                        input: {
                            agentTools: [
                                {
                                    type: 'FLOW',
                                    toolName: 'sub-flow',
                                    flowId: 'flow-123',
                                    pieceMetadata: {},
                                },
                            ],
                        },
                    },
                },
            },
        })

        const result = await cleanUpAgentTools.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const settings = step.settings as Record<string, unknown>
        const input = settings.input as Record<string, unknown>
        const tools = input[AgentPieceProps.AGENT_TOOLS] as Record<string, unknown>[]
        expect(tools[0].type).toBe('FLOW')
        expect(tools[0].flowId).toBe('flow-123')
    })
})

describe('migrate-v10-ai-pieces-provider-id', () => {

    it('should upgrade AI piece version from 0.0.1 to 0.0.4', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '10',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-ai', pieceVersion: '0.0.1', actionName: 'askAi', input: { provider: 'openai' } },
                },
            },
        })

        const result = await migrateV10AiPiecesProviderId.migrate(flowVersion)

        expect(result.schemaVersion).toBe('11')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceVersion).toBe('0.0.4')
    })

    it('should upgrade AI piece version from 0.0.2 to 0.0.4', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '10',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-ai', pieceVersion: '0.0.2', actionName: 'askAi', input: {} },
                },
            },
        })

        const result = await migrateV10AiPiecesProviderId.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceVersion).toBe('0.0.4')
    })

    it('should not modify AI piece with version 0.0.3', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '10',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI',
                    valid: true,
                    settings: { pieceName: '@activepieces/piece-ai', pieceVersion: '0.0.3', actionName: 'askAi', input: {} },
                },
            },
        })

        const result = await migrateV10AiPiecesProviderId.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        expect((step.settings as Record<string, unknown>).pieceVersion).toBe('0.0.3')
    })
})

describe('migrate-v13-add-notes', () => {

    it('should initialize notes to empty array when missing', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '13',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.EMPTY,
                displayName: 'Trigger',
                valid: false,
                settings: {},
            },
        })
        // Simulate missing notes
        delete (flowVersion as Record<string, unknown>).notes

        const result = await migrateV13AddNotes.migrate(flowVersion)

        expect(result.schemaVersion).toBe('14')
        expect(result.notes).toEqual([])
    })

    it('should preserve existing notes', async () => {
        const existingNotes = [{ id: 'note-1', text: 'hello', position: { x: 0, y: 0 }, createdAt: '', updatedAt: '' }]
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '13',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.EMPTY,
                displayName: 'Trigger',
                valid: false,
                settings: {},
            },
        })
        flowVersion.notes = existingNotes as unknown as FlowVersion['notes']

        const result = await migrateV13AddNotes.migrate(flowVersion)

        expect(result.notes).toEqual(existingNotes)
    })
})

describe('migrate-v14-agent-provider-model', () => {

    it('should consolidate provider and model into AI_PROVIDER_MODEL for run_agent', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '14',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI Agent',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-ai',
                        pieceVersion: '0.0.4',
                        actionName: 'run_agent',
                        input: { provider: 'openai', model: 'gpt-4o', prompt: 'do stuff' },
                    },
                },
            },
        })

        const result = await migrateV14AgentProviderModel.migrate(flowVersion)

        expect(result.schemaVersion).toBe('15')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const input = (step.settings as Record<string, unknown>).input as Record<string, unknown>
        const aiProviderModel = input[AgentPieceProps.AI_PROVIDER_MODEL] as Record<string, unknown>
        expect(aiProviderModel.provider).toBe('openai')
        expect(aiProviderModel.model).toBe('gpt-4o')
        expect(input.prompt).toBe('do stuff')
    })

    it('should not modify non-run_agent actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '14',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI Ask',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-ai',
                        pieceVersion: '0.0.4',
                        actionName: 'askAi',
                        input: { provider: 'openai', model: 'gpt-4o' },
                    },
                },
            },
        })

        const result = await migrateV14AgentProviderModel.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const input = (step.settings as Record<string, unknown>).input as Record<string, unknown>
        expect(input[AgentPieceProps.AI_PROVIDER_MODEL]).toBeUndefined()
    })
})

describe('migrate-v15-agent-provider-model', () => {

    it('should update AI piece to 0.1.0 and consolidate run_agent provider/model', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '15',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI Agent',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-ai',
                        pieceVersion: '0.0.4',
                        actionName: 'run_agent',
                        input: { provider: 'anthropic', model: 'claude-3-opus', prompt: 'test' },
                    },
                },
            },
        })

        const result = await migrateV15AgentProviderModel.migrate(flowVersion)

        expect(result.schemaVersion).toBe('16')
        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const settings = step.settings as Record<string, unknown>
        expect(settings.pieceVersion).toBe('0.1.0')
        const input = settings.input as Record<string, unknown>
        const aiProviderModel = input[AgentPieceProps.AI_PROVIDER_MODEL] as Record<string, unknown>
        expect(aiProviderModel.provider).toBe('anthropic')
        expect(aiProviderModel.model).toBe('claude-3-opus')
    })

    it('should update AI piece version for non-run_agent actions', async () => {
        const flowVersion = createLegacyFlowVersion({
            schemaVersion: '15',
            trigger: {
                name: 'trigger',
                type: FlowTriggerType.PIECE,
                displayName: 'Trigger',
                valid: true,
                settings: { pieceName: 'test', pieceVersion: '1.0.0', triggerName: 'test', input: {} },
                nextAction: {
                    name: 'step_1',
                    type: FlowActionType.PIECE,
                    displayName: 'AI Ask',
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-ai',
                        pieceVersion: '0.0.4',
                        actionName: 'askAi',
                        input: { provider: 'openai' },
                    },
                },
            },
        })

        const result = await migrateV15AgentProviderModel.migrate(flowVersion)

        const trigger = result.trigger as unknown as Record<string, unknown>
        const step = trigger.nextAction as Record<string, unknown>
        const settings = step.settings as Record<string, unknown>
        expect(settings.pieceVersion).toBe('0.1.0')
        const input = settings.input as Record<string, unknown>
        expect(input[AgentPieceProps.AI_PROVIDER_MODEL]).toBeUndefined()
    })
})

function createLegacyFlowVersion(overrides: { schemaVersion: string | undefined, trigger: Record<string, unknown> }): FlowVersion {
    return {
        id: 'test-version-id',
        flowId: 'test-flow-id',
        displayName: 'Test Flow',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        updatedBy: 'test-user',
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: overrides.schemaVersion,
        connectionIds: [],
        agentIds: [],
        notes: [],
        steps: [],
        backupFiles: null,
        trigger: overrides.trigger as unknown as FlowVersion['trigger'],
    }
}
