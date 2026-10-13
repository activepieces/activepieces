import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { CreateAIProviderRequest, UpdateAIProviderRequest } from '../../src/lib/management/ai-providers'

const bedrockRequest = {
    displayName: 'AWS Bedrock',
    provider: AIProviderName.BEDROCK,
    config: { region: 'us-east-1' },
    auth: { accessKeyId: 'ASIA', secretAccessKey: 'secret' },
}

describe('AI provider requests', () => {
    it('keeps every credential the provider models', () => {
        expect(CreateAIProviderRequest.parse(bedrockRequest).auth).toEqual(bedrockRequest.auth)
        expect(UpdateAIProviderRequest.parse({ displayName: 'AWS Bedrock', auth: bedrockRequest.auth }).auth).toEqual(bedrockRequest.auth)
    })

    it('keeps a bedrock session token, so temporary credentials still reach AWS', () => {
        const auth = { ...bedrockRequest.auth, sessionToken: 'temporary' }

        expect(CreateAIProviderRequest.parse({ ...bedrockRequest, auth }).auth).toEqual(auth)
        expect(UpdateAIProviderRequest.parse({ displayName: 'AWS Bedrock', auth }).auth).toEqual(auth)
    })

    it('rejects a credential field it cannot honour instead of dropping it', () => {
        const auth = { ...bedrockRequest.auth, profileArn: 'arn:aws:rolesanywhere:::profile/1' }

        expect(CreateAIProviderRequest.safeParse({ ...bedrockRequest, auth }).success).toBe(false)
        expect(UpdateAIProviderRequest.safeParse({ displayName: 'AWS Bedrock', auth }).success).toBe(false)
    })

    it('still accepts every provider that sends only an api key', () => {
        const request = { displayName: 'OpenAI', provider: AIProviderName.OPENAI, config: {}, auth: { apiKey: 'sk-live' } }

        expect(CreateAIProviderRequest.safeParse(request).success).toBe(true)
        expect(UpdateAIProviderRequest.safeParse({ displayName: 'OpenAI', auth: { apiKey: 'sk-live' } }).success).toBe(true)
    })
})
