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

    describe('multiple keys per provider', () => {
        const customConfig = (baseUrl: string, models: { modelId: string, modelName: string, modelType: string }[] = []) => ({
            baseUrl,
            apiKeyHeader: 'Authorization',
            models,
        })

        const engineGet = async (path: string, projectId: string) => {
            const engineToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                projectId,
                platform: { id: ctx.platform.id },
            })
            return app!.inject({
                method: 'GET',
                url: path,
                headers: { authorization: `Bearer ${engineToken}` },
            })
        }

        it('allows two configurations for the same provider', async () => {
            for (const name of ['Key A', 'Key B']) {
                const response = await ctx.post('/v1/ai-providers', {
                    provider: AIProviderName.CUSTOM,
                    displayName: name,
                    config: customConfig(`https://api.example.com/${name.replace(' ', '-')}`),
                    auth: { apiKey: 'test-key' },
                })
                expect(response?.statusCode).toBe(StatusCodes.OK)
            }

            const list = await ctx.get('/v1/ai-providers')
            const customRows = list?.json().filter((p: { provider: string }) => p.provider === AIProviderName.CUSTOM)
            expect(customRows).toHaveLength(2)
        })

        it('resolves the key with the most specific project scope first', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'All projects',
                config: customConfig('https://all.example.com'),
                created: '2026-08-10T00:00:00.000Z',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Scoped',
                config: customConfig('https://scoped.example.com'),
                projectScope: 'selected',
                projectIds: [ctx.project.id],
                created: '2026-08-01T00:00:00.000Z',
            })

            const response = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`, ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().config.baseUrl).toBe('https://scoped.example.com')
        })

        it('breaks specificity ties by newest created', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Older',
                config: customConfig('https://older.example.com'),
                created: '2026-08-01T00:00:00.000Z',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Newer',
                config: customConfig('https://newer.example.com'),
                created: '2026-08-10T00:00:00.000Z',
            })

            const response = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`, ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().config.baseUrl).toBe('https://newer.example.com')
        })

        it('excludes a project listed in an except scope', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Except this project',
                config: customConfig('https://except.example.com'),
                projectScope: 'except',
                projectIds: [ctx.project.id],
            })

            const response = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`, ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('allows a project not listed in an except scope', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Except another project',
                config: customConfig('https://except-other.example.com'),
                projectScope: 'except',
                projectIds: [apId()],
            })

            const response = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`, ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().config.baseUrl).toBe('https://except-other.example.com')
        })

        it('rejects creating the managed ACTIVEPIECES provider', async () => {
            const response = await ctx.post('/v1/ai-providers', {
                provider: AIProviderName.ACTIVEPIECES,
                displayName: 'Activepieces',
                config: {},
                auth: { apiKey: 'k', apiKeyHash: 'h' },
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('keeps a single chat provider across keys of the same provider', async () => {
            const first = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Chat A',
                config: customConfig('https://chat-a.example.com'),
                enabledForChat: true,
            })
            const second = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Chat B',
                config: customConfig('https://chat-b.example.com'),
            })

            const update = await ctx.post(`/v1/ai-providers/${second.id}`, {
                displayName: 'Chat B',
                enabledForChat: true,
            })
            expect(update?.statusCode).toBe(StatusCodes.OK)

            const list = await ctx.get('/v1/ai-providers')
            const chatRows = list?.json().filter((p: { enabledForChat: boolean }) => p.enabledForChat)
            expect(chatRows).toHaveLength(1)
            expect(chatRows[0].id).toBe(second.id)
            expect(chatRows[0].id).not.toBe(first.id)
        })

        it('filters models by the resolved key allow-list for engine calls only', async () => {
            const models = [
                { modelId: 'model-a', modelName: 'Model A', modelType: 'text' },
                { modelId: 'model-b', modelName: 'Model B', modelType: 'text' },
            ]
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Restricted models',
                config: customConfig('https://models.example.com', models),
                modelScope: 'selected',
                modelIds: ['model-a'],
            })

            const engineResponse = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/models`, ctx.project.id)
            expect(engineResponse?.statusCode).toBe(StatusCodes.OK)
            expect(engineResponse?.json().map((m: { id: string }) => m.id)).toEqual(['model-a'])

            const adminResponse = await ctx.get(`/v1/ai-providers/${AIProviderName.CUSTOM}/models`)
            expect(adminResponse?.statusCode).toBe(StatusCodes.OK)
            expect(adminResponse?.json().map((m: { id: string }) => m.id).sort()).toEqual(['model-a', 'model-b'])
        })
    })
})
