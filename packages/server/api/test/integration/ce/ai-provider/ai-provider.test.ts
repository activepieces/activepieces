import { AIProviderName, apId } from '@activepieces/core-utils'
import { DefaultProjectRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
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

describe('AI Providers API', () => {
    describe('POST /v1/ai-providers (create)', () => {
        it('should create a custom provider with defaultHeaders', async () => {
            const response = await ctx.post('/v1/ai-providers', {
                provider: AIProviderName.CUSTOM,
                displayName: 'My Custom Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    defaultHeaders: {
                        'X-Organization-Id': 'org-123',
                        'X-Tenant': 'tenant-abc',
                    },
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', {
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
            })
            expect((saved as any).config.defaultHeaders).toEqual({
                'X-Organization-Id': 'org-123',
                'X-Tenant': 'tenant-abc',
            })
        })
    })

    describe('POST /v1/ai-providers/:id (update)', () => {
        it('should update defaultHeaders on an existing provider', async () => {
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Existing Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
            })

            const response = await ctx.post(`/v1/ai-providers/${provider.id}`, {
                displayName: 'Existing Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    defaultHeaders: { 'X-Custom': 'value-1' },
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', { id: provider.id })
            expect((saved as any).config.defaultHeaders).toEqual({ 'X-Custom': 'value-1' })
        })
    })

    describe('GET /v1/ai-providers/:provider/config', () => {
        it('should return config with defaultHeaders and platformId', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Config Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    defaultHeaders: { 'X-Org': 'org-789' },
                },
            })

            const engineToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                projectId: ctx.project.id,
                platform: { id: ctx.platform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`,
                headers: { authorization: `Bearer ${engineToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
           
            expect(body.provider).toBe(AIProviderName.CUSTOM)
            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.config.defaultHeaders).toEqual({ 'X-Org': 'org-789' })
        })

        it('should return platformId even without custom headers config', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Minimal Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
            })

            const engineToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                projectId: ctx.project.id,
                platform: { id: ctx.platform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`,
                headers: { authorization: `Bearer ${engineToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.config.defaultHeaders).toBeUndefined()
        })
    })

    describe('GET /v1/ai-providers (list)', () => {
        it('should include config with defaultHeaders when listing providers', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Listed Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    defaultHeaders: { 'X-Test': 'test' },
                },
            })

            const response = await ctx.get('/v1/ai-providers')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            const customProvider = body.find(
                (p: any) => p.provider === AIProviderName.CUSTOM,
            )
            expect(customProvider).toBeDefined()
            expect(customProvider.config.defaultHeaders).toEqual({ 'X-Test': 'test' })
        })
    })

    describe('authorization: mutations require platform admin', () => {
        const createBody = {
            provider: AIProviderName.CUSTOM,
            displayName: 'Attacker Provider',
            config: {
                baseUrl: 'https://attacker.example.com/v1',
                apiKeyHeader: 'Authorization',
                models: [],
            },
            auth: { apiKey: 'attacker-key' },
        }

        it('forbids a non-admin platform member from creating a provider', async () => {
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.post('/v1/ai-providers', createBody)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('forbids a non-admin platform member from updating a provider', async () => {
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Victim Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
            })
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.post(`/v1/ai-providers/${provider.id}`, createBody)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('forbids a non-admin platform member from deleting a provider', async () => {
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Victim Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
            })
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.delete(`/v1/ai-providers/${provider.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('allows a platform admin to delete a provider', async () => {
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Admin Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
            })

            const response = await ctx.delete(`/v1/ai-providers/${provider.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('still allows a non-admin platform member to list providers', async () => {
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.get('/v1/ai-providers')

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('DELETE /v1/ai-providers/routing (reset)', () => {
        const openAiSlot = { provider: AIProviderName.OPENAI, modelId: 'gpt-4.1' }
        const openAiTier = { main: openAiSlot, backup1: openAiSlot, backup2: openAiSlot }
        const tiers = { fast: openAiTier, smart: openAiTier, premium: openAiTier }

        it('removes the saved routing so GET falls back to derived defaults', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.OPENAI,
            })

            const upsertResponse = await ctx.post('/v1/ai-providers/routing', { tiers })
            expect(upsertResponse?.statusCode).toBe(StatusCodes.OK)
            expect(upsertResponse?.json().isDefault).toBe(false)

            const deleteResponse = await ctx.delete('/v1/ai-providers/routing')
            expect(deleteResponse?.statusCode).toBe(StatusCodes.OK)
            expect(deleteResponse?.json().isDefault).toBe(true)

            const getResponse = await ctx.get('/v1/ai-providers/routing')
            expect(getResponse?.statusCode).toBe(StatusCodes.OK)
            expect(getResponse?.json().isDefault).toBe(true)
        })

        it('forbids a non-admin platform member from resetting routing', async () => {
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.delete('/v1/ai-providers/routing')

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
