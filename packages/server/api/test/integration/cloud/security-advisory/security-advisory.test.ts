import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { mockBasicUser } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Security Advisories API', () => {
    describe('GET /v1/security-advisories', () => {
        it('returns forbidden when the requester is a platform member (non-admin)', async () => {
            const ctx = await createTestContext(app!)

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: ctx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const memberToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: ctx.platform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/security-advisories',
                headers: {
                    authorization: `Bearer ${memberToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('returns forbidden when the requester is unauthenticated', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/security-advisories',
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('returns forbidden when the principal is a service token', async () => {
            const ctx = await createTestContext(app!)

            const serviceToken = await generateMockToken({
                type: PrincipalType.SERVICE,
                id: 'service-key-id',
                platform: { id: ctx.platform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/security-advisories',
                headers: {
                    authorization: `Bearer ${serviceToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
