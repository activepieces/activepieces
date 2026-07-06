import { PlatformRole, PrincipalType } from '@activepieces/shared'
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

describe('System Health API', () => {
    describe('GET /v1/health/system', () => {
        it('platform admin gets the system health checks including the release block', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/health/system')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toMatchObject({
                cpu: expect.any(Boolean),
                disk: expect.any(Boolean),
                ram: expect.any(Boolean),
                database: expect.any(Boolean),
                release: {
                    current: expect.any(String),
                    workers: {
                        total: expect.any(Number),
                        versionMismatched: expect.any(Number),
                        mismatchedVersions: expect.any(Array),
                    },
                },
            })
        })

        it('reports no worker version skew when no workers are connected', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/health/system')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const { release } = response?.json()
            expect(release.workers.total).toBe(0)
            expect(release.workers.versionMismatched).toBe(0)
            expect(release.workers.mismatchedVersions).toEqual([])
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
                url: '/api/v1/health/system',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
