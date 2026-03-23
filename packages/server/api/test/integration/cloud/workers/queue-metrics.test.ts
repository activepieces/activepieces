import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockApiKey, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createServiceContext, createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Queue Metrics API', () => {
    describe('GET /v1/worker-machines/queue-metrics', () => {
        it('platform admin (USER token) can call endpoint and gets queue shape', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/worker-machines/queue-metrics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveProperty('queues')
            expect(Array.isArray(body.queues)).toBe(true)
            body.queues.forEach((q: unknown) => {
                expect(q).toMatchObject({
                    name: expect.any(String),
                    waiting: expect.any(Number),
                    active: expect.any(Number),
                })
            })
        })

        it('API key (SERVICE token) can call endpoint', async () => {
            const ctx = await createTestContext(app!)
            const serviceCtx = await createServiceContext(app!, ctx)

            const response = await serviceCtx.get('/v1/worker-machines/queue-metrics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveProperty('queues')
        })

        it('non-platform-admin member is rejected with 403', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/worker-machines/queue-metrics',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('unauthenticated request is rejected', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/worker-machines/queue-metrics',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
