import { EmbedSubdomainStatus, apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Embed Subdomain API', () => {
    describe('GET /v1/embed-subdomain', () => {
        it('should return null when no subdomain exists', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: true },
            })

            const response = await ctx.get('/v1/embed-subdomain')

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()).toBeNull()
        })

        it('should return subdomain record when one exists', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: true },
            })

            const hostname = `test-${apId().slice(0, 8).toLowerCase()}.example.com`
            await databaseConnection().getRepository('embed_subdomain').save({
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: ctx.platform.id,
                hostname,
                status: EmbedSubdomainStatus.ACTIVE,
                cloudflareId: `cf-${apId()}`,
                verificationRecords: [],
            })

            const response = await ctx.get('/v1/embed-subdomain')

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.platformId).toBe(ctx.platform.id)
            expect(body.hostname).toBe(hostname)
            expect(body.status).toBe(EmbedSubdomainStatus.ACTIVE)
        })

        it('should return 402 when embedding is not enabled', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: false },
            })

            const response = await ctx.get('/v1/embed-subdomain')

            expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })
    })

    describe('POST /v1/platforms/:id (allowedEmbedOrigins)', () => {
        it('should update allowed embed origins on platform plan', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: true },
            })

            const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, {
                allowedEmbedOrigins: ['https://myapp.com', 'https://dashboard.myapp.com'],
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.allowedEmbedOrigins).toEqual(['https://myapp.com', 'https://dashboard.myapp.com'])
        })
    })

    describe('POST /v1/embed-subdomain', () => {
        it('should reject hostname without TLD', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: true },
            })

            const response = await ctx.post('/v1/embed-subdomain', {
                hostname: 'invalid',
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should reject hostname shorter than 4 characters', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: true },
            })

            const response = await ctx.post('/v1/embed-subdomain', {
                hostname: 'a.b',
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should reject hostname with uppercase characters', async () => {
            const ctx = await createTestContext(app!, {
                plan: { embeddingEnabled: true },
            })

            const response = await ctx.post('/v1/embed-subdomain', {
                hostname: 'Invalid.Example.com',
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })
})
