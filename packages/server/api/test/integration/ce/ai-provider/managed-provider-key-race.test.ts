import { AIProviderName, isNil } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { openRouterApi, OpenRouterApikey } from '../../../../src/app/ee/platform/platform-plan/openrouter/openrouter-api'
import { EncryptedObject, encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    vi.restoreAllMocks()
    ctx = await createTestContext(app)
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

function slowMintingKeys(): () => Promise<{ key: string, data: OpenRouterApikey }> {
    let minted = 0
    return async () => {
        minted += 1
        const id = minted
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { key: `sk-or-${id}`, data: mockOpenRouterKey(`hash-${id}`) }
    }
}

async function readPersistedApiKey(platformId: string): Promise<string | undefined> {
    const row = await db.findOneBy<{ auth: EncryptedObject }>('ai_provider', {
        platformId,
        provider: AIProviderName.ACTIVEPIECES,
    })
    if (isNil(row)) {
        return undefined
    }
    const auth = await encryptUtils.decryptObject<{ apiKey?: string }>(row.auth)
    return auth.apiKey
}

describe('managed AI provider key provisioning', () => {
    it('mints exactly one OpenRouter key when two first reads race', async () => {
        const createKey = vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())

        const [first, second] = await Promise.all([
            aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id),
            aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id),
        ])

        expect(createKey).toHaveBeenCalledTimes(1)
        expect(first.apiKey).toBe(second.apiKey)
        expect(first.apiKeyHash).toBe(second.apiKeyHash)
        expect(await readPersistedApiKey(ctx.platform.id)).toBe(first.apiKey)
    })

    it('releases the lock and provisions on the next read when minting fails', async () => {
        const createKey = vi.spyOn(openRouterApi, 'createKey').mockRejectedValueOnce(new Error('[OpenRouter] POST /keys error: 500'))

        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow('[OpenRouter] POST /keys error: 500')
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()

        createKey.mockImplementation(slowMintingKeys())
        const recovered = await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)

        expect(recovered.apiKey).toBe('sk-or-1')
        expect(await readPersistedApiKey(ctx.platform.id)).toBe('sk-or-1')
    })

    it('does not hand back a key that was not persisted when the row is deleted mid-mint', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(async () => {
            await db.delete('ai_provider', (await db.findOneByOrFail<{ id: string }>('ai_provider', {
                platformId: ctx.platform.id,
                provider: AIProviderName.ACTIVEPIECES,
            })).id)
            return { key: 'sk-or-1', data: mockOpenRouterKey('hash-1') }
        })

        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow()
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
    })

    it('does not mint again once the platform already has a managed key', async () => {
        const createKey = vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())

        const provisioned = await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)
        const [third, fourth] = await Promise.all([
            aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id),
            aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id),
        ])

        expect(createKey).toHaveBeenCalledTimes(1)
        expect(third.apiKey).toBe(provisioned.apiKey)
        expect(fourth.apiKey).toBe(provisioned.apiKey)
        expect(await readPersistedApiKey(ctx.platform.id)).toBe(provisioned.apiKey)
    })
})
