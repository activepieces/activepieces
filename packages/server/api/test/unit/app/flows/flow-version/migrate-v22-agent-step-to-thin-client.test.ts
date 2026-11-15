import { FlowActionType, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV22AgentStepToThinClient } from '../../../../../src/app/flows/flow-version/migrations/migrate-v22-agent-step-to-thin-client'

function flowWith(input: Record<string, unknown>, pieceVersion = '0.5.0'): FlowVersion {
    return {
        schemaVersion: '22',
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            valid: true,
            displayName: 'Trigger',
            nextAction: {
                name: 'step_1',
                type: FlowActionType.PIECE,
                displayName: 'Run Agent',
                valid: true,
                settings: { pieceName: '@activepieces/piece-ai', pieceVersion, actionName: 'run_agent', input },
            },
        },
    } as unknown as FlowVersion
}

function agentStep(migrated: FlowVersion) {
    const step = (migrated.trigger as unknown as { nextAction: { settings: { pieceVersion: string, input: Record<string, unknown> } } }).nextAction
    return step.settings
}

describe('migrateV22AgentStepToThinClient', () => {
    it('moves the pinned connection to an id and the step to the thin client together', async () => {
        const migrated = await migrateV22AgentStepToThinClient.migrate(flowWith({
            prompt: 'do a thing',
            agentTools: [{ type: 'PIECE', toolName: 'send', pieceMetadata: { pieceName: '@activepieces/piece-gmail', predefinedInput: { auth: '{{connections[\'my-gmail\']}}' } } }],
        }))

        const settings = agentStep(migrated)
        expect(settings.pieceVersion).toBe('0.6.0')
        expect(settings.input.agentTools).toEqual([
            expect.objectContaining({ pieceMetadata: expect.objectContaining({ predefinedInput: { auth: 'my-gmail' } }) }),
        ])
        expect(migrated.schemaVersion).toBe('23')
    })

    it('never rewrites a connection without also moving the version, since the old path cannot read an id', async () => {
        const migrated = await migrateV22AgentStepToThinClient.migrate(flowWith({
            prompt: 'do a thing',
            agentTools: [{ type: 'PIECE', toolName: 'send', pieceMetadata: { predefinedInput: { auth: '{{connections[\'my-gmail\']}}' } } }],
        }))

        const settings = agentStep(migrated)
        const auth = (settings.input.agentTools as Array<{ pieceMetadata: { predefinedInput: { auth: string } } }>)[0].pieceMetadata.predefinedInput.auth
        expect(auth === 'my-gmail' && settings.pieceVersion === '0.6.0').toBe(true)
    })

    it('gives a step with no max steps the default the prop carries', async () => {
        const migrated = await migrateV22AgentStepToThinClient.migrate(flowWith({ prompt: 'do a thing' }))

        expect(agentStep(migrated).input.maxSteps).toBe(20)
    })

    it('keeps a max steps the author already chose', async () => {
        const migrated = await migrateV22AgentStepToThinClient.migrate(flowWith({ prompt: 'do a thing', maxSteps: 75 }))

        expect(agentStep(migrated).input.maxSteps).toBe(75)
    })

    it('leaves an already-migrated connection alone', async () => {
        const migrated = await migrateV22AgentStepToThinClient.migrate(flowWith({
            agentTools: [{ type: 'PIECE', pieceMetadata: { predefinedInput: { auth: 'already-an-id' } } }],
        }))

        const auth = (agentStep(migrated).input.agentTools as Array<{ pieceMetadata: { predefinedInput: { auth: string } } }>)[0].pieceMetadata.predefinedInput.auth
        expect(auth).toBe('already-an-id')
    })

    it('does not touch a step that is not the agent', async () => {
        const flow = flowWith({ prompt: 'x' })
        const notAgent = JSON.parse(JSON.stringify(flow))
        notAgent.trigger.nextAction.settings.pieceName = '@activepieces/piece-gmail'

        const migrated = await migrateV22AgentStepToThinClient.migrate(notAgent)

        expect(agentStep(migrated).pieceVersion).toBe('0.5.0')
    })
})
