import { describe, expect, it } from 'vitest'
import {
    AI_PIECE_NAME,
    AI_PIECE_PROVIDER_INTRODUCED_AT,
    AIProviderName,
} from '../../../src/index'

describe('AI_PIECE_PROVIDER_INTRODUCED_AT', () => {
    it('has an entry for every AIProviderName value', () => {
        for (const provider of Object.values(AIProviderName)) {
            expect(
                AI_PIECE_PROVIDER_INTRODUCED_AT[provider],
                `missing introducedAt entry for provider "${provider}" — add it to AI_PIECE_PROVIDER_INTRODUCED_AT`,
            ).toBeDefined()
        }
    })

    it('has the expected piece name constant', () => {
        expect(AI_PIECE_NAME).toBe('@activepieces/piece-ai')
    })
})
