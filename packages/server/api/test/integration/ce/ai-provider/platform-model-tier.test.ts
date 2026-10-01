import { AIProviderName, apId } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformModelTier, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
})

describe('Platform model tiers API', () => {
    describe('create', () => {
        it('makes the first tier default and fast, and appends positions', async () => {
            const key = await seedKey({ testCtx: ctx })
            const first = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'Fast' }) })
            const second = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'Expert' }) })

            expect(first).toMatchObject({ isDefault: true, isFast: true, position: 0, emoji: '⚡' })
            expect(second).toMatchObject({ isDefault: false, isFast: false, position: 1 })
        })

        it('rejects bad entry counts and duplicate entries', async () => {
            const key = await seedKey({ testCtx: ctx })
            const entry = { configId: key.id, modelId: 'gpt-4o' }
            const tooMany = Array.from({ length: 6 }, (_, i) => ({ configId: key.id, modelId: `model-${i}` }))

            const empty = await ctx.post(TIERS, tierBody({ configId: key.id, entries: [] }))
            const overLimit = await ctx.post(TIERS, tierBody({ configId: key.id, entries: tooMany }))
            const duplicate = await ctx.post(TIERS, tierBody({ configId: key.id, entries: [entry, entry] }))

            expect(empty.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(overLimit.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(duplicate.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('rejects a key from another platform', async () => {
            const otherCtx = await createTestContext(app!)
            const foreignKey = await seedKey({ testCtx: otherCtx })

            const response = await ctx.post(TIERS, tierBody({ configId: foreignKey.id }))

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('rejects the Activepieces credits key', async () => {
            const managed = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES })

            const response = await ctx.post(TIERS, tierBody({ configId: managed.id }))

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('rejects a model the key does not allow', async () => {
            const key = await seedKey({ testCtx: ctx, modelScope: 'selected', modelIds: ['allowed-model'] })

            const blocked = await ctx.post(TIERS, tierBody({ configId: key.id, entries: [{ configId: key.id, modelId: 'other-model' }] }))
            const allowed = await ctx.post(TIERS, tierBody({ configId: key.id, entries: [{ configId: key.id, modelId: 'allowed-model' }] }))

            expect(blocked.statusCode).toBe(StatusCodes.CONFLICT)
            expect(allowed.statusCode).toBe(StatusCodes.OK)
        })

        it('stores a thinking budget and rejects one too small to think', async () => {
            const key = await seedKey({ testCtx: ctx })

            const saved = await createTier({ testCtx: ctx, body: { ...tierBody({ configId: key.id }), thinkingBudget: 2048 } })
            const tooSmall = await ctx.post(TIERS, { ...tierBody({ configId: key.id, name: 'Other' }), thinkingBudget: 500 })
            const cleared = await ctx.post(`${TIERS}/${saved.id}`, { thinkingBudget: null })

            expect(saved.thinkingBudget).toBe(2048)
            expect(tooSmall.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(cleared.json().thinkingBudget).toBeNull()
        })

        it('rejects a duplicate live name and frees it after delete', async () => {
            const key = await seedKey({ testCtx: ctx })
            const first = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'Fast' }) })
            const other = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'Other' }) })

            const duplicate = await ctx.post(TIERS, tierBody({ configId: key.id, name: 'Fast' }))
            await ctx.delete(`${TIERS}/${first.id}`, { replacedBy: other.id })
            const reused = await ctx.post(TIERS, tierBody({ configId: key.id, name: 'Fast' }))

            expect(duplicate.statusCode).toBe(StatusCodes.CONFLICT)
            expect(reused.statusCode).toBe(StatusCodes.OK)
        })

        it('caps a platform at 50 live tiers', async () => {
            const key = await seedKey({ testCtx: ctx })
            await db.save('platform_model_tier', Array.from({ length: 50 }, (_, i) => ({
                id: apId(),
                platformId: ctx.platform.id,
                name: `Tier ${i}`,
                emoji: '⚡',
                position: i,
                entries: [{ configId: key.id, modelId: 'gpt-4o' }],
                isDefault: i === 0,
                isFast: i === 0,
            })))

            const response = await ctx.post(TIERS, tierBody({ configId: key.id, name: 'One too many' }))

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('keeps exactly one default when two first tiers are created at once', async () => {
            const key = await seedKey({ testCtx: ctx })

            const responses = await Promise.all([
                ctx.post(TIERS, tierBody({ configId: key.id, name: 'One' })),
                ctx.post(TIERS, tierBody({ configId: key.id, name: 'Two' })),
            ])
            const tiers = await listAdmin({ testCtx: ctx })

            expect(responses.map((response) => response.statusCode)).toEqual([StatusCodes.OK, StatusCodes.OK])
            expect(tiers.filter((tier) => tier.isDefault)).toHaveLength(1)
            expect(tiers.filter((tier) => tier.isFast)).toHaveLength(1)
        })
    })

    describe('update and reorder', () => {
        it('moves the default and fast pointers', async () => {
            const key = await seedKey({ testCtx: ctx })
            const first = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'A' }) })
            const second = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'B' }) })

            const response = await ctx.post(`${TIERS}/${second.id}`, { isDefault: true, isFast: true, name: 'B2' })
            const tiers = await listAdmin({ testCtx: ctx })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(tiers.find((tier) => tier.id === first.id)).toMatchObject({ isDefault: false, isFast: false })
            expect(tiers.find((tier) => tier.id === second.id)).toMatchObject({ isDefault: true, isFast: true, name: 'B2' })
        })

        it('reorders only with the exact live set', async () => {
            const key = await seedKey({ testCtx: ctx })
            const a = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'A' }) })
            const b = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'B' }) })

            const partial = await ctx.post(`${TIERS}/reorder`, { tierIds: [b.id] })
            const full = await ctx.post(`${TIERS}/reorder`, { tierIds: [b.id, a.id] })

            expect(partial.statusCode).toBe(StatusCodes.CONFLICT)
            expect(full.statusCode).toBe(StatusCodes.OK)
            expect(full.json().map((tier: PlatformModelTier) => tier.id)).toEqual([b.id, a.id])
        })
    })

    describe('isolation and access', () => {
        it('hides one platform\'s tiers from another platform', async () => {
            const key = await seedKey({ testCtx: ctx })
            const tier = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id }) })
            const otherCtx = await createTestContext(app!)

            const list = await otherCtx.get(`${TIERS}/admin`)
            const update = await otherCtx.post(`${TIERS}/${tier.id}`, { name: 'Stolen' })
            const remove = await otherCtx.delete(`${TIERS}/${tier.id}`, { replacedBy: apId() })
            const reorder = await otherCtx.post(`${TIERS}/reorder`, { tierIds: [tier.id] })

            expect(list.json()).toEqual([])
            expect(update.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(remove.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(reorder.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('lets project members and the engine read the slim list only', async () => {
            const key = await seedKey({ testCtx: ctx })
            await createTier({ testCtx: ctx, body: tierBody({ configId: key.id }) })
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
            const engineToken = await generateMockToken({ type: PrincipalType.ENGINE, id: apId(), projectId: ctx.project.id, platform: { id: ctx.platform.id } })

            const memberList = await member.get(TIERS, { projectId: ctx.project.id })
            const engineList = await app!.inject({ method: 'GET', url: `/api${TIERS}`, headers: { authorization: `Bearer ${engineToken}` } })
            const memberAdmin = await member.get(`${TIERS}/admin`)
            const memberCreate = await member.post(TIERS, tierBody({ configId: key.id, name: 'Member' }))

            expect(memberList.statusCode).toBe(StatusCodes.OK)
            expect(engineList.statusCode).toBe(StatusCodes.OK)
            expect(memberList.json()[0]).toMatchObject({ mainModel: { provider: AIProviderName.CUSTOM, modelId: 'gpt-4o' }, fallbackCount: 0 })
            expect(memberList.body).not.toContain(key.id)
            expect(memberAdmin.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(memberCreate.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('delete', () => {
        it('flattens the replacement chain and moves the pointers', async () => {
            const key = await seedKey({ testCtx: ctx })
            const a = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'A' }) })
            const b = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'B' }) })
            const c = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'C' }) })

            const first = await ctx.delete(`${TIERS}/${a.id}`, { replacedBy: b.id })
            const second = await ctx.delete(`${TIERS}/${b.id}`, { replacedBy: c.id })
            const oldA = await findWithDeleted({ id: a.id })
            const live = await listAdmin({ testCtx: ctx })

            expect(first.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(second.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(oldA).toMatchObject({ replacedBy: c.id, isDefault: false, isFast: false })
            expect(live.map((tier) => tier.id)).toEqual([c.id])
            expect(live[0]).toMatchObject({ isDefault: true, isFast: true })
        })

        it('refuses a bad replacement', async () => {
            const key = await seedKey({ testCtx: ctx })
            const a = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'A' }) })
            const b = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'B' }) })
            const c = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'C' }) })
            await ctx.delete(`${TIERS}/${c.id}`, { replacedBy: b.id })
            const otherCtx = await createTestContext(app!)
            const foreign = await createTier({ testCtx: otherCtx, body: tierBody({ configId: (await seedKey({ testCtx: otherCtx })).id }) })

            const self = await ctx.delete(`${TIERS}/${a.id}`, { replacedBy: a.id })
            const deleted = await ctx.delete(`${TIERS}/${a.id}`, { replacedBy: c.id })
            const crossPlatform = await ctx.delete(`${TIERS}/${a.id}`, { replacedBy: foreign.id })
            const missing = await ctx.delete(`${TIERS}/${a.id}`)

            expect(self.statusCode).toBe(StatusCodes.CONFLICT)
            expect(deleted.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(crossPlatform.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(missing.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('deletes the last tier without a replacement, then frees its key', async () => {
            const key = await seedKey({ testCtx: ctx })
            const tier = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id }) })

            const removed = await ctx.delete(`${TIERS}/${tier.id}`)
            const keyRemoved = await ctx.delete(`/v1/ai-providers/${key.id}`)
            const gone = await findWithDeleted({ id: tier.id })

            expect(removed.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(keyRemoved.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(await listAdmin({ testCtx: ctx })).toEqual([])
            expect(gone).toMatchObject({ replacedBy: null, isDefault: false, isFast: false })
        })

        it('keeps the last tier while specific models are hidden', async () => {
            const key = await seedKey({ testCtx: ctx })
            const tier = await createTier({ testCtx: ctx, body: tierBody({ configId: key.id }) })
            await ctx.post(`${TIERS}/settings`, { aiSpecificModelsVisible: false })

            const removed = await ctx.delete(`${TIERS}/${tier.id}`)
            const selfReplacement = await ctx.delete(`${TIERS}/${tier.id}`, { replacedBy: tier.id })

            expect(removed.statusCode).toBe(StatusCodes.CONFLICT)
            expect(selfReplacement.statusCode).toBe(StatusCodes.CONFLICT)
            expect(await listAdmin({ testCtx: ctx })).toHaveLength(1)
        })
    })

    describe('key guard', () => {
        it('refuses to delete a key a tier uses', async () => {
            const key = await seedKey({ testCtx: ctx })
            await createTier({ testCtx: ctx, body: tierBody({ configId: key.id, name: 'Expert' }) })

            const response = await ctx.delete(`/v1/ai-providers/${key.id}`)

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response.body).toContain('Expert')
        })

        it('refuses a scope change that drops a tier model', async () => {
            const key = await seedKey({ testCtx: ctx })
            await createTier({ testCtx: ctx, body: tierBody({ configId: key.id }) })

            const dropping = await ctx.post(`/v1/ai-providers/${key.id}`, { displayName: key.displayName, modelScope: 'selected', modelIds: ['other-model'] })
            const keeping = await ctx.post(`/v1/ai-providers/${key.id}`, { displayName: key.displayName, modelScope: 'selected', modelIds: ['gpt-4o'] })

            expect(dropping.statusCode).toBe(StatusCodes.CONFLICT)
            expect(keeping.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('settings', () => {
        it('round-trips the visibility toggle and needs a tier to hide specific models', async () => {
            const blocked = await ctx.post(`${TIERS}/settings`, { aiSpecificModelsVisible: false })
            const key = await seedKey({ testCtx: ctx })
            await createTier({ testCtx: ctx, body: tierBody({ configId: key.id }) })
            const saved = await ctx.post(`${TIERS}/settings`, { aiSpecificModelsVisible: false })
            const platform = await ctx.get(`/v1/platforms/${ctx.platform.id}`)

            expect(blocked.statusCode).toBe(StatusCodes.CONFLICT)
            expect(saved.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(platform.json().aiSpecificModelsVisible).toBe(false)
        })
    })
})

async function seedKey({ testCtx, modelScope, modelIds }: { testCtx: TestContext, modelScope?: 'all' | 'selected', modelIds?: string[] }): Promise<{ id: string, displayName: string }> {
    return mockAndSaveAIProvider({
        platformId: testCtx.platform.id,
        provider: AIProviderName.CUSTOM,
        config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
        ...(modelScope ? { modelScope } : {}),
        ...(modelIds ? { modelIds } : {}),
    })
}

function tierBody({ configId, name, entries }: { configId: string, name?: string, entries?: { configId: string, modelId: string }[] }): Record<string, unknown> {
    return {
        name: name ?? 'Fast',
        emoji: '⚡',
        description: null,
        entries: entries ?? [{ configId, modelId: 'gpt-4o' }],
    }
}

async function createTier({ testCtx, body }: { testCtx: TestContext, body: Record<string, unknown> }): Promise<PlatformModelTier> {
    const response = await testCtx.post(TIERS, body)
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function listAdmin({ testCtx }: { testCtx: TestContext }): Promise<PlatformModelTier[]> {
    const response = await testCtx.get(`${TIERS}/admin`)
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

async function findWithDeleted({ id }: { id: string }): Promise<unknown> {
    return databaseConnection().getRepository('platform_model_tier').findOne({ where: { id }, withDeleted: true })
}

const TIERS = '/v1/platform-model-tiers'
