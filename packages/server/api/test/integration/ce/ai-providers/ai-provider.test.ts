import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { AIProviderName, apId, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('AI Provider API', () => {
    describe('GET / (List AI Providers)', () => {
        it('should list AI providers for the platform', async () => {
            const ctx = await createTestContext(app!)
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.OPENAI,
            })

            const response = await ctx.get('/v1/ai-providers')
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(Array.isArray(body)).toBe(true)
            const openaiProvider = body.find((p: { provider: string }) => p.provider === AIProviderName.OPENAI)
            expect(openaiProvider).toBeDefined()
        })

        it('should return list when no custom providers configured', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get('/v1/ai-providers')
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(Array.isArray(response.json())).toBe(true)
        })
    })

    describe('DELETE /:id (Delete AI Provider)', () => {
        it('should delete an AI provider', async () => {
            const ctx = await createTestContext(app!)
            const provider = await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.ANTHROPIC,
            })

            const response = await ctx.delete(`/v1/ai-providers/${provider.id}`)
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('should succeed when deleting non-existent provider', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.delete(`/v1/ai-providers/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })

    describe('GET /:provider/config (Engine-only)', () => {
        it('should return provider config for ENGINE principal', async () => {
            const ctx = await createTestContext(app!)
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.OPENAI,
            })

            const engineToken = await generateMockToken({
                id: ctx.user.id,
                type: PrincipalType.ENGINE,
                platform: { id: ctx.platform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/v1/ai-providers/${AIProviderName.OPENAI}/config`,
                headers: {
                    authorization: `Bearer ${engineToken}`,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.provider).toBe(AIProviderName.OPENAI)
            expect(body.auth).toBeDefined()
        })

        it('should reject non-ENGINE principal', async () => {
            const ctx = await createTestContext(app!)
            await mockAndSaveAIProvider({
                platformId: ctx.platform.id,
                provider: AIProviderName.OPENAI,
            })

            const response = await ctx.get(`/v1/ai-providers/${AIProviderName.OPENAI}/config`)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
