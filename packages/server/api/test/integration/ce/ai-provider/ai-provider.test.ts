import { AIProviderName, apId } from '@activepieces/core-utils'
import { AIProviderModelType, DefaultProjectRole, PrincipalType, ProviderModelConfig } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockProject, mockAndSaveAIProvider } from '../../../helpers/mocks'
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

    describe('GET /v1/ai-providers/configs (admin list)', () => {
        it('should include config with defaultHeaders when listing configurations', async () => {
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

            const response = await ctx.get('/v1/ai-providers/configs')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            const customProvider = body.find(
                (p: { provider: string }) => p.provider === AIProviderName.CUSTOM,
            )
            expect(customProvider).toBeDefined()
            expect(customProvider.config.defaultHeaders).toEqual({ 'X-Test': 'test' })
        })

        it('forbids a non-admin platform member from listing configurations', async () => {
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.get('/v1/ai-providers/configs')

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('GET /v1/ai-providers (project list)', () => {
        it('hides a configuration whose project scope excludes the caller project', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Other project only',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
                projectScope: 'selected',
                projectIds: [apId()],
            })

            const response = await ctx.get('/v1/ai-providers', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().some((p: { provider: string }) => p.provider === AIProviderName.CUSTOM)).toBe(false)
        })

        it('never leaks project ids or model allow-lists to a project caller', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Scoped elsewhere',
                config: {
                    baseUrl: 'https://api.example.com/v1',
                    apiKeyHeader: 'Authorization',
                    models: [],
                },
                projectScope: 'except',
                projectIds: [apId()],
                modelScope: 'selected',
                modelIds: ['model-a'],
            })

            const response = await ctx.get('/v1/ai-providers', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            for (const entry of response?.json()) {
                expect(Object.keys(entry).sort()).toEqual(['enabledForChat', 'keys', 'name', 'provider'])
                for (const key of entry.keys) {
                    expect(Object.keys(key).sort()).toEqual(['id', 'name'])
                }
            }
        })

        it('rejects a project list request without a project id', async () => {
            const response = await ctx.get('/v1/ai-providers')

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('rejects a sibling project the caller is not a member of', async () => {
            const sibling = createMockProject({
                ownerId: ctx.user.id,
                platformId: ctx.platform.id,
            })
            await db.save('project', sibling)
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.get('/v1/ai-providers', { projectId: sibling.id })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
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

        it('still allows a non-admin platform member to list providers for their project', async () => {
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.get('/v1/ai-providers', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('multiple keys per provider', () => {
        const customConfig = (baseUrl: string, models: ProviderModelConfig[] = []) => ({
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

            const list = await ctx.get('/v1/ai-providers/configs')
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
                config: { baseUrl: 'https://scoped.example.com', apiKeyHeader: 'Authorization', models: [] },
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
                config: { baseUrl: 'https://except.example.com', apiKeyHeader: 'Authorization', models: [] },
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

        it('lists one entry per provider for an engine caller, whatever the key count', async () => {
            for (const name of ['Key A', 'Key B']) {
                await mockAndSaveAIProvider({
                    platformId: ctx.platform.id,
                    provider: AIProviderName.CUSTOM,
                    displayName: name,
                    config: customConfig(`https://api.example.com/${name.replace(' ', '-')}`),
                })
            }

            const response = await engineGet('/api/v1/ai-providers', ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const customRows = response?.json().filter((p: { provider: string }) => p.provider === AIProviderName.CUSTOM)
            expect(customRows).toHaveLength(1)
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

            const list = await ctx.get('/v1/ai-providers/configs')
            const chatRows = list?.json().filter((p: { enabledForChat: boolean }) => p.enabledForChat)
            expect(chatRows).toHaveLength(1)
            expect(chatRows[0].id).toBe(second.id)
            expect(chatRows[0].id).not.toBe(first.id)
        })

        it('reports a provider as chat-enabled even when the chat key is not the ranking winner', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Chat key, ranked last',
                config: customConfig('https://chat.example.com'),
                enabledForChat: true,
                created: '2026-08-01T00:00:00.000Z',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Newer key, ranked first',
                config: customConfig('https://newer.example.com'),
                created: '2026-08-10T00:00:00.000Z',
            })

            const response = await engineGet('/api/v1/ai-providers', ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const customRow = response?.json().find((p: { provider: string }) => p.provider === AIProviderName.CUSTOM)
            expect(customRow.enabledForChat).toBe(true)
        })

        it('lists a specific key models through the admin configuration route', async () => {
            const olderModels = [
                { modelId: 'older-model', modelName: 'Older model', modelType: AIProviderModelType.TEXT },
            ]
            const newerModels = [
                { modelId: 'newer-model', modelName: 'Newer model', modelType: AIProviderModelType.TEXT },
            ]
            const older = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Older key',
                config: customConfig('https://older-key.example.com', olderModels),
                created: '2026-08-01T00:00:00.000Z',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Newer key',
                config: customConfig('https://newer-key.example.com', newerModels),
                created: '2026-08-10T00:00:00.000Z',
            })

            const resolved = await ctx.get(`/v1/ai-providers/${AIProviderName.CUSTOM}/models`, { projectId: ctx.project.id })
            expect(resolved?.statusCode).toBe(StatusCodes.OK)
            expect(resolved?.json().map((m: { id: string }) => m.id)).toEqual(['newer-model'])

            const byConfig = await ctx.get(`/v1/ai-providers/configs/${older.id}/models`)
            expect(byConfig?.statusCode).toBe(StatusCodes.OK)
            expect(byConfig?.json().map((m: { id: string }) => m.id)).toEqual(['older-model'])
        })

        it('forbids a non-admin member from listing models of a configuration by id', async () => {
            const excluded = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Other project key',
                config: customConfig('https://other-project.example.com', [
                    { modelId: 'secret-model', modelName: 'Secret model', modelType: AIProviderModelType.TEXT },
                ]),
                projectScope: 'selected',
                projectIds: [apId()],
            })
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.get(`/v1/ai-providers/configs/${excluded.id}/models`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('does not resolve a configuration excluded from the caller project', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Other project key',
                config: customConfig('https://other-project.example.com', [
                    { modelId: 'secret-model', modelName: 'Secret model', modelType: AIProviderModelType.TEXT },
                ]),
                projectScope: 'selected',
                projectIds: [apId()],
            })

            const response = await ctx.get(`/v1/ai-providers/${AIProviderName.CUSTOM}/models`, { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('scopes the chat provider to the requesting project', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Scoped chat key',
                config: customConfig('https://chat-scoped.example.com'),
                enabledForChat: true,
                projectScope: 'selected',
                projectIds: [apId()],
            })

            const excluded = await aiProviderService(app!.log).getChatProvider({
                platformId: ctx.platform.id,
                scope: { type: 'project', projectId: ctx.project.id },
            })
            expect(excluded).toBeNull()

            const platformWide = await aiProviderService(app!.log).getChatProvider({
                platformId: ctx.platform.id,
                scope: { type: 'platform' },
            })
            expect(platformWide?.provider).toBe(AIProviderName.CUSTOM)
        })

        it('applies the key model allow-list on every project-scoped call', async () => {
            const models = [
                { modelId: 'model-a', modelName: 'Model A', modelType: AIProviderModelType.TEXT },
                { modelId: 'model-b', modelName: 'Model B', modelType: AIProviderModelType.TEXT },
            ]
            const restricted = await mockAndSaveAIProvider({
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

            const userResponse = await ctx.get(`/v1/ai-providers/${AIProviderName.CUSTOM}/models`, { projectId: ctx.project.id })
            expect(userResponse?.statusCode).toBe(StatusCodes.OK)
            expect(userResponse?.json().map((m: { id: string }) => m.id)).toEqual(['model-a'])

            const adminResponse = await ctx.get(`/v1/ai-providers/configs/${restricted.id}/models`)
            expect(adminResponse?.statusCode).toBe(StatusCodes.OK)
            expect(adminResponse?.json().map((m: { id: string }) => m.id).sort()).toEqual(['model-a', 'model-b'])
        })

        it('carries every eligible key of a provider on its single project-list entry', async () => {
            const first = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Key A',
                config: customConfig('https://a.example.com'),
            })
            const second = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Key B',
                config: customConfig('https://b.example.com'),
            })

            const response = await engineGet('/api/v1/ai-providers', ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const customRow = response?.json().find((p: { provider: string }) => p.provider === AIProviderName.CUSTOM)
            expect(customRow.name).toBe('OpenAI Compatible')
            expect(customRow.keys.map((key: { id: string }) => key.id).sort()).toEqual([first.id, second.id].sort())
            expect(customRow.keys.map((key: { name: string }) => key.name).sort()).toEqual(['Key A', 'Key B'])
        })
    })

    describe('pinning a specific key', () => {
        const customConfig = (baseUrl: string, models: ProviderModelConfig[] = []) => ({
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

        it('serves the named key rather than the deterministic winner', async () => {
            const older = await mockAndSaveAIProvider({
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

            const pinned = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config?configId=${older.id}`, ctx.project.id)
            expect(pinned?.statusCode).toBe(StatusCodes.OK)
            expect(pinned?.json().config.baseUrl).toBe('https://older.example.com')
            expect(pinned?.json().configId).toBe(older.id)

            const automatic = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config`, ctx.project.id)
            expect(automatic?.json().config.baseUrl).toBe('https://newer.example.com')
        })

        it('refuses a key whose project scope excludes the caller project', async () => {
            const excluded = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Other project only',
                config: customConfig('https://other.example.com'),
                projectScope: 'selected',
                projectIds: [apId()],
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'This project',
                config: customConfig('https://mine.example.com'),
            })

            const response = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config?configId=${excluded.id}`, ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('refuses a key that belongs to another provider than the path names', async () => {
            const openai = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.OPENAI,
                displayName: 'OpenAI key',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Custom key',
                config: customConfig('https://custom.example.com'),
            })

            const response = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/config?configId=${openai.id}`, ctx.project.id)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('applies the named key model allow-list', async () => {
            const models = [
                { modelId: 'model-a', modelName: 'Model A', modelType: AIProviderModelType.TEXT },
                { modelId: 'model-b', modelName: 'Model B', modelType: AIProviderModelType.TEXT },
            ]
            const restricted = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Restricted',
                config: customConfig('https://restricted.example.com', models),
                modelScope: 'selected',
                modelIds: ['model-a'],
                created: '2026-08-01T00:00:00.000Z',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Unrestricted',
                config: customConfig('https://unrestricted.example.com', models),
                created: '2026-08-10T00:00:00.000Z',
            })

            const pinned = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/models?configId=${restricted.id}`, ctx.project.id)
            expect(pinned?.statusCode).toBe(StatusCodes.OK)
            expect(pinned?.json().map((m: { id: string }) => m.id)).toEqual(['model-a'])

            const automatic = await engineGet(`/api/v1/ai-providers/${AIProviderName.CUSTOM}/models`, ctx.project.id)
            expect(automatic?.json().map((m: { id: string }) => m.id).sort()).toEqual(['model-a', 'model-b'])
        })
    })

    describe('key names are unique per provider', () => {
        const customConfig = (baseUrl: string) => ({
            baseUrl,
            apiKeyHeader: 'Authorization',
            models: [],
        })

        const createCustom = (displayName: string, baseUrl: string) => ctx.post('/v1/ai-providers', {
            provider: AIProviderName.CUSTOM,
            displayName,
            config: customConfig(baseUrl),
            auth: { apiKey: 'test-key' },
        })

        it('rejects a second key of the same provider with the same name', async () => {
            expect((await createCustom('Anthropic key', 'https://one.example.com'))?.statusCode).toBe(StatusCodes.OK)

            const duplicate = await createCustom('  anthropic KEY ', 'https://two.example.com')

            expect(duplicate?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('allows the same name on a different provider', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.OPENAI,
                displayName: 'Shared name',
            })

            const response = await createCustom('Shared name', 'https://one.example.com')

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('allows the same credentials under two different names', async () => {
            expect((await createCustom('Key one', 'https://one.example.com'))?.statusCode).toBe(StatusCodes.OK)
            expect((await createCustom('Key two', 'https://two.example.com'))?.statusCode).toBe(StatusCodes.OK)
        })

        it('rejects renaming a key onto another key of the same provider', async () => {
            const first = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Taken',
                config: customConfig('https://one.example.com'),
            })
            const second = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Free',
                config: customConfig('https://two.example.com'),
            })

            const clash = await ctx.post(`/v1/ai-providers/${second.id}`, { displayName: 'Taken' })
            expect(clash?.statusCode).toBe(StatusCodes.CONFLICT)

            const sameName = await ctx.post(`/v1/ai-providers/${first.id}`, { displayName: 'Taken' })
            expect(sameName?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('keyServesScope (a run that changes project mid-turn)', () => {
        it('refuses the project a running key is scoped away from', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'This project only',
                config: { baseUrl: 'https://scoped.example.com', apiKeyHeader: 'Authorization', models: [] },
                enabledForChat: true,
                projectScope: 'selected',
                projectIds: [ctx.project.id],
            })

            const serves = await aiProviderService(app!.log).keyServesScope({
                platformId: ctx.platform.id,
                resolvedFor: { type: 'project', projectId: ctx.project.id },
                target: { type: 'project', projectId: apId() },
            })

            expect(serves).toBe(false)
        })

        it('lets a key its owner left open to every project follow the switch', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Every project',
                config: { baseUrl: 'https://open.example.com', apiKeyHeader: 'Authorization', models: [] },
                enabledForChat: true,
                projectScope: 'all',
            })

            const serves = await aiProviderService(app!.log).keyServesScope({
                platformId: ctx.platform.id,
                resolvedFor: { type: 'project', projectId: ctx.project.id },
                target: { type: 'project', projectId: apId() },
            })

            expect(serves).toBe(true)
        })

        it('refuses when any key the run could be holding excludes the target project', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Open chat key',
                config: { baseUrl: 'https://open-chat.example.com', apiKeyHeader: 'Authorization', models: [] },
                enabledForChat: true,
                projectScope: 'all',
            })
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'Pinned to this project',
                config: { baseUrl: 'https://pinned.example.com', apiKeyHeader: 'Authorization', models: [] },
                projectScope: 'selected',
                projectIds: [ctx.project.id],
            })

            const serves = await aiProviderService(app!.log).keyServesScope({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                resolvedFor: { type: 'project', projectId: ctx.project.id },
                target: { type: 'project', projectId: apId() },
            })

            expect(serves).toBe(false)
        })

        it('refuses to drop a restricted key out of project scope altogether', async () => {
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.CUSTOM,
                displayName: 'All but one',
                config: { baseUrl: 'https://except.example.com', apiKeyHeader: 'Authorization', models: [] },
                enabledForChat: true,
                projectScope: 'except',
                projectIds: [apId()],
            })

            const serves = await aiProviderService(app!.log).keyServesScope({
                platformId: ctx.platform.id,
                resolvedFor: { type: 'project', projectId: ctx.project.id },
                target: { type: 'platform' },
            })

            expect(serves).toBe(false)
        })
    })
})
