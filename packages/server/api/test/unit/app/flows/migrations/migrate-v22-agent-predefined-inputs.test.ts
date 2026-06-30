import {
    FieldControlMode,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV22AgentPredefinedInputs } from '../../../../../src/app/flows/flow-version/migrations/migrate-v22-agent-predefined-inputs'

const baseVersion = (nextAction: FlowVersion['trigger']['nextAction']): FlowVersion => ({
    id: 'fv-1',
    displayName: 'fixture',
    flowId: 'flow-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    updatedBy: null,
    valid: true,
    state: FlowVersionState.DRAFT,
    schemaVersion: '22',
    connectionIds: [],
    agentIds: [],
    notes: [],
    trigger: {
        type: FlowTriggerType.PIECE,
        name: 'trigger',
        displayName: 'Trigger',
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: { pieceName: '@activepieces/piece-webhook', pieceVersion: '0.0.1', triggerName: 'catch_request', input: {}, propertySettings: {} },
        nextAction,
    },
})

const runAgentStep = (agentTools: unknown[]): FlowVersion['trigger']['nextAction'] => ({
    type: FlowActionType.PIECE,
    name: 'step_1',
    displayName: 'Run Agent',
    skip: false,
    valid: true,
    lastUpdatedDate: new Date().toISOString(),
    settings: {
        pieceName: '@activepieces/piece-ai',
        pieceVersion: '0.1.0',
        actionName: 'run_agent',
        input: { agentTools },
        propertySettings: {},
    },
} as unknown as FlowVersion['trigger']['nextAction'])

function firstToolPieceMetadata(result: FlowVersion): Record<string, unknown> {
    const tools = result.trigger.nextAction?.settings.input.agentTools as Array<{ pieceMetadata: Record<string, unknown> }>
    return tools[0].pieceMetadata
}

describe('migrateV22AgentPredefinedInputs', () => {
    it('converts a legacy flat predefinedInput into { auth, fields }', async () => {
        const version = baseVersion(runAgentStep([
            {
                type: 'PIECE', toolName: 'perplexity-ai-ask-ai_1uulmb_mcp',
                pieceMetadata: {
                    pieceName: '@activepieces/piece-perplexity-ai', actionName: 'ask-ai', pieceVersion: '0.2.8',
                    predefinedInput: { auth: "{{connections['c1']}}", model: 'sonar-reasoning-pro' },
                },
            },
        ]))

        const result = await migrateV22AgentPredefinedInputs.migrate(version)

        expect(firstToolPieceMetadata(result).predefinedInput).toEqual({
            auth: "{{connections['c1']}}",
            fields: { model: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'sonar-reasoning-pro' } },
        })
        expect(result.schemaVersion).toBe('23')
    })

    it('maps every non-auth key to a CHOOSE_YOURSELF field and tolerates a missing auth', async () => {
        const version = baseVersion(runAgentStep([
            {
                type: 'PIECE', toolName: 'gcal',
                pieceMetadata: {
                    pieceName: '@activepieces/piece-google-calendar', actionName: 'get_events', pieceVersion: '0.7.4',
                    predefinedInput: { calendar_id: 'me@x.com', event_types: ['default', 'focusTime'] },
                },
            },
        ]))

        const result = await migrateV22AgentPredefinedInputs.migrate(version)

        expect(firstToolPieceMetadata(result).predefinedInput).toEqual({
            fields: {
                calendar_id: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'me@x.com' },
                event_types: { mode: FieldControlMode.CHOOSE_YOURSELF, value: ['default', 'focusTime'] },
            },
        })
    })

    it('leaves an already-migrated { auth, fields } predefinedInput untouched (idempotent)', async () => {
        const alreadyNew = {
            auth: "{{connections['c1']}}",
            fields: { model: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'sonar' } },
        }
        const version = baseVersion(runAgentStep([
            {
                type: 'PIECE', toolName: 't',
                pieceMetadata: { pieceName: '@activepieces/piece-x', actionName: 'a', pieceVersion: '1.0.0', predefinedInput: alreadyNew },
            },
        ]))

        const result = await migrateV22AgentPredefinedInputs.migrate(version)

        expect(firstToolPieceMetadata(result).predefinedInput).toEqual(alreadyNew)
    })

    it('does not touch non-piece tools or non-agent steps', async () => {
        const flowTool = { type: 'FLOW', toolName: 'some-flow-tool', flowId: 'abc' }
        const version = baseVersion(runAgentStep([flowTool]))

        const result = await migrateV22AgentPredefinedInputs.migrate(version)
        const tools = result.trigger.nextAction?.settings.input.agentTools as unknown[]
        expect(tools[0]).toEqual(flowTool)

        const nonAgent = baseVersion({
            type: FlowActionType.PIECE, name: 'step_1', displayName: 'HTTP', skip: false, valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: { pieceName: '@activepieces/piece-http', pieceVersion: '0.0.1', actionName: 'send', input: { agentTools: 'not-an-agent' }, propertySettings: {} },
        } as unknown as FlowVersion['trigger']['nextAction'])
        const nonAgentResult = await migrateV22AgentPredefinedInputs.migrate(nonAgent)
        expect(nonAgentResult.trigger.nextAction?.settings.input.agentTools).toBe('not-an-agent')
    })

    it('targets schema version 22', () => {
        expect(migrateV22AgentPredefinedInputs.targetSchemaVersion).toBe('22')
    })
})
