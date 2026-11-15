import { AIProviderName } from '@activepieces/core-utils'
import { AgentConfig, AgentOutputFieldType, AgentToolType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { agentHelpers } from '../../../../../src/app/ee/agent/agent-helpers'

const config: AgentConfig = {
    instructions: 'Sort the inbox and never reply to spam.',
    provider: AIProviderName.OPENAI,
    modelName: 'gpt-5',
    maxSteps: 7,
    tools: [{
        type: AgentToolType.PIECE,
        toolName: 'gmail_search',
        pieceMetadata: { pieceName: '@activepieces/piece-gmail', pieceVersion: '0.12.10', actionName: 'gmail_search_mail' },
    }],
    structuredOutput: [{ displayName: 'Subject', type: AgentOutputFieldType.TEXT }],
}

describe('what a saved agent contributes to its run', () => {
    it('carries the instructions as the system prompt, which is the whole point of linking one', () => {
        const fields = agentHelpers.jobFieldsFromConfig({ config })

        expect(fields.promptOverride).toEqual({ system: 'Sort the inbox and never reply to spam.' })
    })

    it('carries the tools, model, step budget and output shape', () => {
        const fields = agentHelpers.jobFieldsFromConfig({ config })

        expect(fields.tools).toEqual(config.tools)
        expect(fields.structuredOutput).toEqual(config.structuredOutput)
        expect(fields.maxSteps).toBe(7)
        expect(fields.modelName).toBe('gpt-5')
        expect(fields.provider).toBe(AIProviderName.OPENAI)
    })

    it('leaves the provider off entirely when the agent names none, so the platform default applies', () => {
        const fields = agentHelpers.jobFieldsFromConfig({ config: { ...config, provider: null, modelName: null } })

        expect('provider' in fields).toBe(false)
        expect(fields.modelName).toBeNull()
    })
})
