import { AIProviderName, apId, ErrorCode } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'
import { AIProviderSchema } from '../../../../src/app/ai/ai-provider-entity'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { openRouterApi, OpenRouterApikey } from '../../../../src/app/ee/platform/platform-plan/openrouter/openrouter-api'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.mock('../../../../src/app/helper/sleep', () => ({ sleep: async () => undefined }))

let app: FastifyInstance
let owner: TestContext
let otherPlatform: TestContext
let createKey: MockInstance<typeof openRouterApi.createKey>

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    vi.restoreAllMocks()
    vi.spyOn(openRouterApi, 'deleteKey').mockResolvedValue(undefined)
    vi.spyOn(openRouterApi, 'isKeyLive').mockResolvedValue(true)
    owner = await createTestContext(app)
    otherPlatform = await createTestContext(app)
    createKey = vi.spyOn(openRouterApi, 'createKey')
})

function mockOpenRouterKey(hash: string): OpenRouterApikey {
    return {
        hash,
        name: 'test',
        label: 'test',
        disabled: false,
        limit: 500,
        limit_remaining: 500,
        limit_reset: 'monthly',
        include_byok_in_limit: false,
        usage: 0,
        usage_daily: 0,
        usage_weekly: 0,
        usage_monthly: 0,
        byok_usage: 0,
        byok_usage_daily: 0,
        byok_usage_weekly: 0,
        byok_usage_monthly: 0,
        created_at: new Date().toISOString(),
        updated_at: null,
        expires_at: null,
    }
}

async function keylessManagedRow(platformId: string): Promise<AIProviderSchema> {
    createKey.mockRejectedValueOnce(new Error('[OpenRouter] POST /keys error: 500'))
    await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(platformId)).rejects.toThrow()
    createKey.mockReset()
    return db.findOneByOrFail<AIProviderSchema>('ai_provider', { platformId, provider: AIProviderName.ACTIVEPIECES })
}

describe('managed OpenRouter key minting guards', () => {
    it('refuses to mint when the platform id is missing', async () => {
        const row = await keylessManagedRow(owner.platform.id)
        const missing: Record<string, string> = {}

        await expect(aiProviderService(app.log).configForTierKey({ platformId: missing.platformId, key: row })).rejects.toMatchObject({ error: { code: ErrorCode.VALIDATION } })

        expect(createKey).not.toHaveBeenCalled()
    })

    it('refuses to mint when the platform id is blank', async () => {
        const row = await keylessManagedRow(owner.platform.id)

        await expect(aiProviderService(app.log).configForTierKey({ platformId: '  ', key: row })).rejects.toThrow()

        expect(createKey).not.toHaveBeenCalled()
    })

    it('refuses to mint when the platform does not exist', async () => {
        const row = await keylessManagedRow(owner.platform.id)

        await expect(aiProviderService(app.log).configForTierKey({ platformId: apId(), key: row })).rejects.toThrow()

        expect(createKey).not.toHaveBeenCalled()
    })

    it('refuses to mint a key for another platform\'s row', async () => {
        const row = await keylessManagedRow(owner.platform.id)

        await expect(aiProviderService(app.log).configForTierKey({ platformId: otherPlatform.platform.id, key: row })).rejects.toThrow()

        expect(createKey).not.toHaveBeenCalled()
    })

    it('still mints for the row\'s own platform, tagged with the masked management key', async () => {
        const row = await keylessManagedRow(owner.platform.id)
        createKey.mockResolvedValue({ key: 'sk-or-owner', data: mockOpenRouterKey('hash-owner') })
        process.env.AP_OPENROUTER_PROVISION_KEY = 'sk-or-v1-management-a2dc'
        try {
            const config = await aiProviderService(app.log).configForTierKey({ platformId: owner.platform.id, key: row })

            expect(createKey).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                name: `Platform ${owner.platform.id}`,
                external: { user: 'sk-or-v1-man...2dc' },
            }))
            expect(config.auth).toMatchObject({ apiKey: 'sk-or-owner' })
        }
        finally {
            delete process.env.AP_OPENROUTER_PROVISION_KEY
        }
    })
})
