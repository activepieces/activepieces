import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
    AI_PIECE_NAME,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    PropertySettings,
} from '@activepieces/shared'
import semver from 'semver'
import { describe, expect, it } from 'vitest'
import { migrateV28AiPieceModelPicker } from '../../../../../src/app/flows/flow-version/migrations/migrate-v28-ai-piece-model-picker'

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
    schemaVersion: '28',
    connectionIds: [],
    agentIds: [],
    notes: [],
})

const withAiStep = ({ pieceVersion = '0.11.0', actionName = 'askAi', pieceName = AI_PIECE_NAME, input, propertySettings = {} }: {
    pieceVersion?: string
    actionName?: string
    pieceName?: string
    input: Record<string, unknown>
    propertySettings?: Record<string, PropertySettings>
}): FlowVersion => baseVersion({
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
            propertySettings,
        },
    },
})

async function migratedStep(version: FlowVersion): Promise<MigratedStep> {
    const result = await migrateV28AiPieceModelPicker.migrate(version)
    const settings = result.trigger.nextAction?.settings
    return {
        schemaVersion: result.schemaVersion,
        pieceVersion: settings?.pieceVersion,
        input: settings?.input,
        propertySettings: settings?.propertySettings,
    }
}

describe('migrateV28AiPieceModelPicker', () => {
    it('moves a Credits tier pick into the picker value and moves the step to 0.15.0', async () => {
        const step = await migratedStep(withAiStep({
            pieceVersion: '0.12.0',
            input: { provider: { provider: 'activepieces' }, model: 'smart', prompt: 'hi' },
            propertySettings: { provider: { type: PropertyExecutionType.MANUAL }, prompt: { type: PropertyExecutionType.MANUAL } },
        }))

        expect(step.pieceVersion).toBe('0.15.0')
        expect(step.input).toEqual({ prompt: 'hi', aiProviderModel: { provider: 'activepieces', model: 'smart' } })
        expect(step.propertySettings).toEqual({ prompt: { type: PropertyExecutionType.MANUAL } })
        expect(step.schemaVersion).toBe('29')
    })

    it('turns an old pinned Credits model into the tier it was picked as', async () => {
        const steps = await Promise.all([
            ['anthropic/claude-haiku-4.5', 'fast'],
            ['anthropic/claude-sonnet-4.6', 'smart'],
            ['anthropic/claude-opus-4.8', 'premium'],
        ].map(async ([model, tier]) => {
            const step = await migratedStep(withAiStep({ actionName: 'summarizeText', input: { provider: { provider: 'activepieces' }, model } }))
            return { tier, stored: step.input?.['aiProviderModel'] }
        }))

        for (const { tier, stored } of steps) {
            expect(stored).toEqual({ provider: 'activepieces', model: tier })
        }
    })

    it('keeps a Credits model it does not know as it is', async () => {
        const step = await migratedStep(withAiStep({ input: { provider: { provider: 'activepieces' }, model: 'openai/gpt-4o' } }))

        expect(step.input?.['aiProviderModel']).toEqual({ provider: 'activepieces', model: 'openai/gpt-4o' })
    })

    it('keeps the key on a pick made with the customer\'s own key', async () => {
        const step = await migratedStep(withAiStep({ actionName: 'extractStructuredData', input: { provider: { provider: 'openai', configId: 'key_1' }, model: 'gpt-5.5', mode: 'simple' } }))

        expect(step.input).toEqual({ mode: 'simple', aiProviderModel: { provider: 'openai', model: 'gpt-5.5', configId: 'key_1' } })
        expect(step.pieceVersion).toBe('0.15.0')
    })

    it('reads a provider saved as a bare string', async () => {
        const step = await migratedStep(withAiStep({ actionName: 'classifyText', input: { provider: 'anthropic', model: 'claude-sonnet-4-6' } }))

        expect(step.input?.['aiProviderModel']).toEqual({ provider: 'anthropic', model: 'claude-sonnet-4-6' })
    })

    it('leaves a step alone when the provider or model comes from an expression', async () => {
        const mustache = withAiStep({ input: { provider: { provider: 'openai' }, model: '{{step_0.model}}' } })
        const dynamic = withAiStep({
            input: { provider: { provider: 'openai' }, model: 'gpt-5.5' },
            propertySettings: { provider: { type: PropertyExecutionType.DYNAMIC } },
        })

        for (const version of [mustache, dynamic]) {
            const step = await migratedStep(version)
            expect(step.pieceVersion).toBe('0.11.0')
            expect(step.input).not.toHaveProperty('aiProviderModel')
        }
    })

    it('leaves a step alone when the provider is unknown or the model is empty', async () => {
        for (const input of [{ provider: { provider: 'nope' }, model: 'x' }, { provider: { provider: 'openai' }, model: '' }, {}]) {
            const step = await migratedStep(withAiStep({ input }))
            expect(step.pieceVersion).toBe('0.11.0')
            expect(step.input).toEqual(input)
        }
    })

    it('never touches an image step', async () => {
        const input = { provider: { provider: 'activepieces' }, model: 'google/gemini-3.1-flash-image', prompt: 'a cat' }
        const step = await migratedStep(withAiStep({ actionName: 'generateImage', input }))

        expect(step.pieceVersion).toBe('0.11.0')
        expect(step.input).toEqual(input)
    })

    it('turns an old Credits model on Run Agent into its tier without moving the step', async () => {
        const step = await migratedStep(withAiStep({
            actionName: 'run_agent',
            input: { aiProviderModel: { provider: 'activepieces', model: 'anthropic/claude-opus-4.8' }, prompt: 'go' },
        }))

        expect(step.pieceVersion).toBe('0.11.0')
        expect(step.input).toEqual({ aiProviderModel: { provider: 'activepieces', model: 'premium' }, prompt: 'go' })
    })

    it('fixes an old Credits model on a step already on the picker, and leaves the rest of it alone', async () => {
        const oldId = await migratedStep(withAiStep({ pieceVersion: '0.15.0', input: { aiProviderModel: { provider: 'activepieces', model: 'anthropic/claude-haiku-4.5' } } }))
        const tier = await migratedStep(withAiStep({ pieceVersion: '0.15.0', input: { aiProviderModel: { modelTierId: 'tier_1' } } }))

        expect(oldId.input).toEqual({ aiProviderModel: { provider: 'activepieces', model: 'fast' } })
        expect(tier.input).toEqual({ aiProviderModel: { modelTierId: 'tier_1' } })
        expect(tier.pieceVersion).toBe('0.15.0')
    })

    it('never moves a step backwards', async () => {
        const step = await migratedStep(withAiStep({ pieceVersion: '0.16.2', input: { provider: { provider: 'openai' }, model: 'gpt-5.5' } }))

        expect(step.pieceVersion).toBe('0.16.2')
    })

    it('leaves other pieces alone', async () => {
        const input = { provider: { provider: 'activepieces' }, model: 'anthropic/claude-haiku-4.5' }
        const step = await migratedStep(withAiStep({ pieceName: '@activepieces/piece-openai', input }))

        expect(step.input).toEqual(input)
    })

    it('never lets the v23 upgrade register move an AI step onto the picker version', () => {
        const register: { pieces: Record<string, Record<string, { target: string }>> } = JSON.parse(readFileSync(path.resolve('packages/server/api/src/assets/piece-upgrade-register.json'), 'utf-8'))
        const targets = Object.values(register.pieces[AI_PIECE_NAME] ?? {}).map((entry) => entry.target)
        expect(targets.length).toBeGreaterThan(0)
        expect(targets.filter((target) => semver.gte(target, '0.15.0'))).toEqual([])
    })
})

type MigratedStep = {
    schemaVersion: string | null | undefined
    pieceVersion: string | undefined
    input: Record<string, unknown> | undefined
    propertySettings: Record<string, PropertySettings> | undefined
}
