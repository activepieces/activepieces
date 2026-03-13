import { AIProviderName, apId, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
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
        it('should create a custom provider with sendMetadataHeaders', async () => {
            const response = await ctx.post('/v1/ai-providers', {
                provider: AIProviderName.CUSTOM,
                displayName: 'My Custom Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    sendMetadataHeaders: true,
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', {
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
            })
            expect(saved).not.toBeNull()
            expect((saved as any).config.sendMetadataHeaders).toBe(true)
        })

        it('should create a custom provider with defaultHeaders', async () => {
            const response = await ctx.post('/v1/ai-providers', {
                provider: AIProviderName.CUSTOM,
                displayName: 'My Custom Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    defaultHeaders: [
                        { key: 'X-Organization-Id', value: 'org-123' },
                        { key: 'X-Tenant', value: 'tenant-abc' },
                    ],
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', {
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
            })
            expect((saved as any).config.defaultHeaders).toEqual([
                { key: 'X-Organization-Id', value: 'org-123' },
                { key: 'X-Tenant', value: 'tenant-abc' },
            ])
        })

        it('should create a custom provider with both sendMetadataHeaders and defaultHeaders', async () => {
            const response = await ctx.post('/v1/ai-providers', {
                provider: AIProviderName.CUSTOM,
                displayName: 'Full Custom Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'X-Api-Key',
                    models: [],
                    sendMetadataHeaders: true,
                    defaultHeaders: [
                        { key: 'X-Organization-Id', value: 'org-456' },
                    ],
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', {
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
            })
            expect((saved as any).config.sendMetadataHeaders).toBe(true)
            expect((saved as any).config.defaultHeaders).toHaveLength(1)
        })
    })

    describe('POST /v1/ai-providers/:id (update)', () => {
        it('should update sendMetadataHeaders on an existing provider', async () => {
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Existing Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    sendMetadataHeaders: false,
                } as any,
            })

            const response = await ctx.post(`/v1/ai-providers/${provider.id}`, {
                displayName: 'Existing Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    sendMetadataHeaders: true,
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', { id: provider.id })
            expect((saved as any).config.sendMetadataHeaders).toBe(true)
        })

        it('should update defaultHeaders on an existing provider', async () => {
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Existing Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                } as any,
            })

            const response = await ctx.post(`/v1/ai-providers/${provider.id}`, {
                displayName: 'Existing Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    defaultHeaders: [
                        { key: 'X-Custom', value: 'value-1' },
                    ],
                },
                auth: { apiKey: 'test-key' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_provider', { id: provider.id })
            expect((saved as any).config.defaultHeaders).toEqual([
                { key: 'X-Custom', value: 'value-1' },
            ])
        })
    })

    describe('GET /v1/ai-providers/:provider/config', () => {
        it('should return config with sendMetadataHeaders and platformId', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Config Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    sendMetadataHeaders: true,
                    defaultHeaders: [
                        { key: 'X-Org', value: 'org-789' },
                    ],
                } as any,
            })

            const engineToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                projectId: ctx.project.id,
                platform: { id: ctx.platform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/v1/ai-providers/${AIProviderName.CUSTOM}/config`,
                headers: { authorization: `Bearer ${engineToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body.provider).toBe(AIProviderName.CUSTOM)
            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.config.sendMetadataHeaders).toBe(true)
            expect(body.config.defaultHeaders).toEqual([
                { key: 'X-Org', value: 'org-789' },
            ])
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
                } as any,
            })

            const engineToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                projectId: ctx.project.id,
                platform: { id: ctx.platform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/v1/ai-providers/${AIProviderName.CUSTOM}/config`,
                headers: { authorization: `Bearer ${engineToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.config.sendMetadataHeaders).toBeUndefined()
            expect(body.config.defaultHeaders).toBeUndefined()
        })
    })

    describe('GET /v1/ai-providers (list)', () => {
        it('should include config with new fields when listing providers', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Listed Provider',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                    sendMetadataHeaders: true,
                    defaultHeaders: [{ key: 'X-Test', value: 'test' }],
                } as any,
            })

            const response = await ctx.get('/v1/ai-providers')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            const customProvider = body.find(
                (p: any) => p.provider === AIProviderName.CUSTOM,
            )
            expect(customProvider).toBeDefined()
            expect(customProvider.config.sendMetadataHeaders).toBe(true)
            expect(customProvider.config.defaultHeaders).toEqual([
                { key: 'X-Test', value: 'test' },
            ])
        })
    })
})
