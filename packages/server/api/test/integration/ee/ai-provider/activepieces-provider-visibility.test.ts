import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
    process.env.AP_OPENROUTER_PROVISION_KEY = 'test-provision-key'
})

afterAll(async () => {
    delete process.env.AP_OPENROUTER_PROVISION_KEY
    await teardownTestEnvironment()
})

async function visibleProviders({ activepiecesAiProviderHidden }: { activepiecesAiProviderHidden: boolean }) {
    const ctx = await createTestContext(app!, { plan: { embeddingEnabled: true, activepiecesAiProviderHidden } })
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES, enabledForChat: false })
    const listed = await aiProviderService(app!.log).listConfigs(ctx.platform.id)
    const chat = await aiProviderService(app!.log).getChatProvider({ platformId: ctx.platform.id, scope: { type: 'platform' } })
    return { listed: listed.map((row) => row.provider), chat: chat?.provider ?? null }
}

describe('Activepieces AI provider visibility', () => {
    it('hides the provider when the platform\'s own plan includes Embedding', async () => {
        const { listed, chat } = await visibleProviders({ activepiecesAiProviderHidden: true })

        expect(listed).not.toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBeNull()
    })

    it('keeps the provider when Embedding comes only from the self-serve trial', async () => {
        const { listed, chat } = await visibleProviders({ activepiecesAiProviderHidden: false })

        expect(listed).toContain(AIProviderName.ACTIVEPIECES)
        expect(chat).toBe(AIProviderName.ACTIVEPIECES)
    })
})
