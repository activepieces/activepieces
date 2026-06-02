import { PlatformRole, PrincipalType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const reportRange = {
    createdAfter: dayjs().startOf('month').toISOString(),
    createdBefore: dayjs().endOf('month').toISOString(),
}

describe('Health Metrics API', () => {
    describe('GET /v1/health/run-metrics', () => {
        it('platform admin gets the run metrics', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/health/run-metrics', reportRange)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toMatchObject({
                summary: {
                    completed: expect.any(Number),
                    successRate: expect.any(Number),
                    previousCompleted: expect.any(Number),
                    previousSuccessRate: expect.any(Number),
                },
            })
            expect(Array.isArray(body.statusTimeseries)).toBe(true)
            expect(Array.isArray(body.internalErrors)).toBe(true)
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
                url: '/api/v1/health/run-metrics?createdAfter=2026-01-01T00:00:00.000Z&createdBefore=2026-02-01T00:00:00.000Z',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('unauthenticated request is rejected', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/health/run-metrics?createdAfter=2026-01-01T00:00:00.000Z&createdBefore=2026-02-01T00:00:00.000Z',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('GET /v1/health/queue-metrics', () => {
        it('platform admin gets the queue metrics', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/health/queue-metrics')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toMatchObject({
                running: expect.any(Number),
                queued: expect.any(Number),
            })
            expect(Array.isArray(body.stuckJobs)).toBe(true)
        })

        it('unauthenticated request is rejected', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/health/queue-metrics',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('GET /v1/health/history', () => {
        it('platform admin gets 30 daily health entries', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/health/history')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body.days)).toBe(true)
            expect(body.days).toHaveLength(30)
            body.days.forEach((day: unknown) => {
                expect(day).toMatchObject({
                    day: expect.any(String),
                    internalErrors: expect.any(Number),
                    affectedFlows: expect.any(Number),
                    stuckJobs: expect.any(Number),
                })
            })
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
                url: '/api/v1/health/history',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
