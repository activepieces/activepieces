import {
    AI_PIECE_COST_BILLING_VERSION,
    AI_PIECE_NAME,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV26AiPieceCostBilling } from '../../../../../src/app/flows/flow-version/migrations/migrate-v26-ai-piece-cost-billing'

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
    schemaVersion: '26',
    connectionIds: [],
    agentIds: [],
    notes: [],
})

const trigger = (): FlowVersion['trigger'] => ({
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
    },
})

const withAiStep = ({ pieceVersion, actionName = 'askAi', pieceName = AI_PIECE_NAME, input = {} }: {
    pieceVersion: string
    actionName?: string
    pieceName?: string
    input?: Record<string, unknown>
}): FlowVersion => baseVersion({
    ...trigger(),
    nextAction: {
        type: FlowActionType.PIECE,
        name: 'step_1',
        displayName: 'Step 1',
        skip: false,
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {
            pieceName,
            pieceVersion,
            actionName,
            input,
            propertySettings: {},
        },
    },
})

async function migratedVersionOf(version: FlowVersion): Promise<string | undefined> {
    const result = await migrateV26AiPieceCostBilling.migrate(version)
    return result.trigger.nextAction?.settings.pieceVersion
}

async function migratedInputOf(version: FlowVersion): Promise<Record<string, unknown> | undefined> {
    const result = await migrateV26AiPieceCostBilling.migrate(version)
    const step = result.trigger.nextAction
    return step?.type === FlowActionType.PIECE ? step.settings.input : undefined
}

describe('migrateV26AiPieceCostBilling', () => {
    it('moves a step left behind at the old register target onto the cost-reporting version', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: '0.4.5' }))).toBe('0.11.0')
    })

    it('moves an agent step too, so a managed agent run is metered like any other call', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: '0.6.0', actionName: 'run_agent' }))).toBe('0.11.0')
    })

    it('moves the newest version that still predates cost reporting', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: '0.10.1' }))).toBe('0.11.0')
    })

    it('leaves a step already on the cost-reporting version alone', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: '0.11.0' }))).toBe('0.11.0')
    })

    it('never downgrades a step that is ahead of the target', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: '0.12.3' }))).toBe('0.12.3')
    })

    it('moves a step whose version cannot be parsed, since it cannot be reporting cost', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: 'not-a-version' }))).toBe('0.11.0')
    })

    it('leaves every other piece untouched', async () => {
        expect(await migratedVersionOf(withAiStep({ pieceVersion: '0.1.0', pieceName: '@activepieces/piece-openai' }))).toBe('0.1.0')
    })

    it('fills in the max steps an agent step needs, since the new version requires it and the engine applies no default', async () => {
        const input = await migratedInputOf(withAiStep({ pieceVersion: '0.0.5', actionName: 'run_agent', input: { prompt: 'hi' } }))
        expect(input).toEqual({ prompt: 'hi', maxSteps: 20 })
    })

    it('keeps the max steps an agent step already chose', async () => {
        const input = await migratedInputOf(withAiStep({ pieceVersion: '0.6.0', actionName: 'run_agent', input: { maxSteps: 5 } }))
        expect(input).toEqual({ maxSteps: 5 })
    })

    it('leaves the input of a non-agent AI action untouched', async () => {
        const input = await migratedInputOf(withAiStep({ pieceVersion: '0.4.5', actionName: 'askAi', input: { prompt: 'hi' } }))
        expect(input).toEqual({ prompt: 'hi' })
    })

    it('leaves a non-agent input alone when the step is not being moved at all', async () => {
        const input = await migratedInputOf(withAiStep({ pieceVersion: '0.12.3', actionName: 'askAi', input: { prompt: 'hi' } }))
        expect(input).toEqual({ prompt: 'hi' })
    })

    it('fills in max steps for an agent already on the billing version, which the upgrade register can leave without one', async () => {
        const input = await migratedInputOf(withAiStep({ pieceVersion: AI_PIECE_COST_BILLING_VERSION, actionName: 'run_agent', input: { prompt: 'hi' } }))
        expect(input).toEqual({ prompt: 'hi', maxSteps: 20 })
    })

    it('advances the schema version so the migration runs once', async () => {
        const result = await migrateV26AiPieceCostBilling.migrate(withAiStep({ pieceVersion: '0.4.5' }))
        expect(result.schemaVersion).toBe('27')
    })
})
