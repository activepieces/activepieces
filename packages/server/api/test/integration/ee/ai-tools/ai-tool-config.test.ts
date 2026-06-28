import { AiToolCapability, AiToolProvider, DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
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

describe('AI Tools API', () => {
    describe('POST /v1/ai-tools (upsert)', () => {
        it('should create a capability config and encrypt the api key', async () => {
            const response = await ctx.post('/v1/ai-tools', {
                capability: AiToolCapability.WEB_SEARCH,
                provider: AiToolProvider.TAVILY,
                auth: { apiKey: 'super-secret-tavily-key' },
                enabled: true,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const saved = await db.findOneBy('ai_tool_config', {
                platformId: ctx.platform.id,
                capability: AiToolCapability.WEB_SEARCH,
            })
            expect(saved).toBeDefined()
            expect((saved as any).provider).toBe(AiToolProvider.TAVILY)
            expect((saved as any).enabled).toBe(true)
            expect((saved as any).auth.iv).toBeDefined()
            expect((saved as any).auth.data).toBeDefined()
            expect(JSON.stringify((saved as any).auth)).not.toContain(
                'super-secret-tavily-key',
            )
        })

        it('should replace the existing config for the same capability (one per capability)', async () => {
            await ctx.post('/v1/ai-tools', {
                capability: AiToolCapability.WEB_SCRAPING,
                provider: AiToolProvider.FIRECRAWL,
                auth: { apiKey: 'first-key' },
            })
            await ctx.post('/v1/ai-tools', {
                capability: AiToolCapability.WEB_SCRAPING,
                provider: AiToolProvider.APIFY,
                auth: { apiKey: 'second-key' },
            })

            const response = await ctx.get('/v1/ai-tools')
            const body = response?.json()
            const scrapingConfigs = body.filter(
                (c: any) => c.capability === AiToolCapability.WEB_SCRAPING,
            )
            expect(scrapingConfigs).toHaveLength(1)
            expect(scrapingConfigs[0].provider).toBe(AiToolProvider.APIFY)
        })
    })

    describe('GET /v1/ai-tools (list)', () => {
        it('should list configs without exposing the api key', async () => {
            await ctx.post('/v1/ai-tools', {
                capability: AiToolCapability.IMAGE_GENERATION,
                provider: AiToolProvider.FAL,
                auth: { apiKey: 'fal-secret' },
            })

            const response = await ctx.get('/v1/ai-tools')
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            const config = body.find(
                (c: any) => c.capability === AiToolCapability.IMAGE_GENERATION,
            )
            expect(config).toBeDefined()
            expect(config.hasApiKey).toBe(true)
            expect(config.auth).toBeUndefined()
            expect(JSON.stringify(body)).not.toContain('fal-secret')
        })
    })

    describe('POST /v1/ai-tools/:id (update)', () => {
        it('should toggle the enabled flag without re-sending the key', async () => {
            await ctx.post('/v1/ai-tools', {
                capability: AiToolCapability.WEB_SEARCH,
                provider: AiToolProvider.TAVILY,
                auth: { apiKey: 'keep-me' },
                enabled: true,
            })
            const created = await db.findOneBy('ai_tool_config', {
                platformId: ctx.platform.id,
                capability: AiToolCapability.WEB_SEARCH,
            })

            const response = await ctx.post(`/v1/ai-tools/${(created as any).id}`, {
                enabled: false,
            })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const updated = await db.findOneBy('ai_tool_config', {
                id: (created as any).id,
            })
            expect((updated as any).enabled).toBe(false)
            expect(JSON.stringify((updated as any).auth)).not.toContain('keep-me')
        })
    })

    describe('DELETE /v1/ai-tools/:id', () => {
        it('should delete the config', async () => {
            await ctx.post('/v1/ai-tools', {
                capability: AiToolCapability.WEB_SEARCH,
                provider: AiToolProvider.TAVILY,
                auth: { apiKey: 'delete-me' },
            })
            const created = await db.findOneBy('ai_tool_config', {
                platformId: ctx.platform.id,
                capability: AiToolCapability.WEB_SEARCH,
            })

            const response = await ctx.delete(`/v1/ai-tools/${(created as any).id}`)
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)

            const after = await db.findOneBy('ai_tool_config', {
                id: (created as any).id,
            })
            expect(after).toBeNull()
        })
    })

    describe('multi-tenant isolation', () => {
        it('should not list or delete another platform’s config', async () => {
            const otherCtx = await createTestContext(app!)
            await otherCtx.post('/v1/ai-tools', {
                capability: AiToolCapability.WEB_SEARCH,
                provider: AiToolProvider.TAVILY,
                auth: { apiKey: 'other-platform-key' },
            })
            const otherConfig = await db.findOneBy('ai_tool_config', {
                platformId: otherCtx.platform.id,
                capability: AiToolCapability.WEB_SEARCH,
            })

            const listResponse = await ctx.get('/v1/ai-tools')
            const body = listResponse?.json()
            expect(
                body.find((c: any) => c.id === (otherConfig as any).id),
            ).toBeUndefined()

            await ctx.delete(`/v1/ai-tools/${(otherConfig as any).id}`)
            const stillThere = await db.findOneBy('ai_tool_config', {
                id: (otherConfig as any).id,
            })
            expect(stillThere).not.toBeNull()
        })
    })

    describe('authorization (admin-gated)', () => {
        it('should reject a non-admin platform member with 403', async () => {
            const memberCtx = await createMemberContext(app!, ctx, {
                projectRole: DefaultProjectRole.VIEWER,
            })

            const response = await memberCtx.get('/v1/ai-tools')

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
