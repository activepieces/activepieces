import { AIProviderName, apId, isNil } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { openRouterApi, OpenRouterApikey } from '../../../../src/app/ee/platform/platform-plan/openrouter/openrouter-api'
import { EncryptedObject, encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext
let deleteKey: MockInstance<typeof openRouterApi.deleteKey>

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    vi.restoreAllMocks()
    deleteKey = vi.spyOn(openRouterApi, 'deleteKey').mockResolvedValue(undefined)
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

async function findManagedRowId(platformId: string): Promise<string> {
    const row = await db.findOneByOrFail<{ id: string }>('ai_provider', {
        platformId,
        provider: AIProviderName.ACTIVEPIECES,
    })
    return row.id
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
        expect(deleteKey).not.toHaveBeenCalled()
        expect(first.apiKey).toBe(second.apiKey)
        expect(first.apiKeyHash).toBe(second.apiKeyHash)
        expect(await readPersistedApiKey(ctx.platform.id)).toBe(first.apiKey)
    })

    it('releases the lock and provisions on the next read when minting fails', async () => {
        const createKey = vi.spyOn(openRouterApi, 'createKey').mockRejectedValueOnce(new Error('[OpenRouter] POST /keys error: 500'))

        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow('[OpenRouter] POST /keys error: 500')
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
        expect(deleteKey).not.toHaveBeenCalled()

        createKey.mockImplementation(slowMintingKeys())
        const recovered = await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)

        expect(recovered.apiKey).toBe('sk-or-1')
        expect(await readPersistedApiKey(ctx.platform.id)).toBe('sk-or-1')
    })

    it('revokes the minted key and does not hand it back when the row is deleted mid-mint', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(async () => {
            await db.delete('ai_provider', await findManagedRowId(ctx.platform.id))
            return { key: 'sk-or-1', data: mockOpenRouterKey('hash-1') }
        })

        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow()
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
    })

    it('keeps the key another writer stored first and revokes its own', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(async () => {
            await db.update('ai_provider', await findManagedRowId(ctx.platform.id), {
                auth: await encryptUtils.encryptObject({ apiKey: 'sk-or-other', apiKeyHash: 'hash-other' }),
            })
            return { key: 'sk-or-1', data: mockOpenRouterKey('hash-1') }
        })

        const result = await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)

        expect(result.apiKey).toBe('sk-or-other')
        expect(result.apiKeyHash).toBe('hash-other')
        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
        expect(await readPersistedApiKey(ctx.platform.id)).toBe('sk-or-other')
    })

    it('revokes the minted key when storing it fails', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(async () => {
            vi.spyOn(encryptUtils, 'encryptObject').mockRejectedValueOnce(new Error('store failed'))
            return { key: 'sk-or-1', data: mockOpenRouterKey('hash-1') }
        })

        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow('store failed')
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
    })

    it('does not mint again once the platform already has a managed key', async () => {
        const createKey = vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())

        const provisioned = await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)
        const [third, fourth] = await Promise.all([
            aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id),
            aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id),
        ])

        expect(createKey).toHaveBeenCalledTimes(1)
        expect(deleteKey).not.toHaveBeenCalled()
        expect(third.apiKey).toBe(provisioned.apiKey)
        expect(fourth.apiKey).toBe(provisioned.apiKey)
        expect(await readPersistedApiKey(ctx.platform.id)).toBe(provisioned.apiKey)
    })
})

describe('managed AI provider deletion', () => {
    it('revokes the stored key when an admin deletes the managed provider', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())
        await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)

        await aiProviderService(app.log).delete(ctx.platform.id, await findManagedRowId(ctx.platform.id))

        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
    })

    it('revokes the minted key when an admin deletes the managed provider mid-mint', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(async () => {
            await aiProviderService(app.log).delete(ctx.platform.id, await findManagedRowId(ctx.platform.id))
            return { key: 'sk-or-1', data: mockOpenRouterKey('hash-1') }
        })

        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow()

        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
        expect(await db.findOneBy('ai_provider', { platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES })).toBeNull()
    })

    it('removes the managed provider on teardown even when a live tier references it', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())
        await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)
        const managedId = await findManagedRowId(ctx.platform.id)
        await db.save('platform_model_tier', {
            id: apId(),
            platformId: ctx.platform.id,
            name: 'Legacy tier',
            emoji: '⚡',
            position: 0,
            entries: [{ configId: managedId, modelId: 'openai/gpt-4o' }],
            isDefault: true,
        })
        await expect(aiProviderService(app.log).delete(ctx.platform.id, managedId)).rejects.toThrow()

        await aiProviderService(app.log).deleteManagedProvider({ platformId: ctx.platform.id })

        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
    })

    it('revokes the stored key when the platform teardown removes the managed provider', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())
        await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)

        await aiProviderService(app.log).deleteManagedProvider({ platformId: ctx.platform.id })

        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
    })

    it('runs the platform delete in the same transaction and revokes only after it', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())
        await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)
        const steps: string[] = []
        deleteKey.mockImplementation(async () => {
            steps.push('revoke')
        })

        await aiProviderService(app.log).deleteManagedProvider({
            platformId: ctx.platform.id,
            inSameTransaction: async (manager) => {
                const managedRows = await manager.query('SELECT 1 FROM "ai_provider" WHERE "platformId" = $1 AND "provider" = $2', [ctx.platform.id, AIProviderName.ACTIVEPIECES])
                steps.push(`platform delete sees ${managedRows.length} managed rows`)
            },
        })

        expect(steps).toEqual(['platform delete sees 0 managed rows', 'revoke'])
        expect(deleteKey).toHaveBeenCalledExactlyOnceWith({ hash: 'hash-1' })
    })

    it('revokes nothing when the managed provider never got a key', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockRejectedValue(new Error('[OpenRouter] POST /keys error: 500'))
        await expect(aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)).rejects.toThrow()

        await aiProviderService(app.log).deleteManagedProvider({ platformId: ctx.platform.id })

        expect(deleteKey).not.toHaveBeenCalled()
        expect(await db.findOneBy('ai_provider', { platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES })).toBeNull()
    })

    it('keeps the platform deletable when OpenRouter refuses the revoke', async () => {
        vi.spyOn(openRouterApi, 'createKey').mockImplementation(slowMintingKeys())
        await aiProviderService(app.log).getOrCreateActivePiecesProviderAuthConfig(ctx.platform.id)
        deleteKey.mockRejectedValueOnce(new Error('[OpenRouter] DELETE /keys/hash-1 error: 500'))

        await aiProviderService(app.log).deleteManagedProvider({ platformId: ctx.platform.id })

        expect(await readPersistedApiKey(ctx.platform.id)).toBeUndefined()
    })
})
