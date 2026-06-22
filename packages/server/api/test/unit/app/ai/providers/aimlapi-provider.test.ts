import { AIProviderModelType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { aimlapiProvider } from '../../../../../src/app/ai/providers/aimlapi-provider'

describe('aimlapiProvider', () => {
    it('returns a curated text-only starter model catalog', async () => {
        const models = await aimlapiProvider.listModels({ apiKey: 'test-key' }, {})

        expect(models).toEqual(
            expect.arrayContaining([
                { id: 'gpt-5-chat', name: 'GPT-5 Chat', type: AIProviderModelType.TEXT },
                { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', type: AIProviderModelType.TEXT },
                { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', type: AIProviderModelType.TEXT },
                { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: AIProviderModelType.TEXT },
            ]),
        )
        expect(models.every((model) => model.type === AIProviderModelType.TEXT)).toBe(true)
    })
})
