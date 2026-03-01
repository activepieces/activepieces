import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createAuditEvent,
    mockBasicUser,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Audit Event API', () => {
    describe('List Audit event API', () => {
        it('should list audit events', async () => {
            // arrange
            const ctxOne = await createTestContext(app!, {
                plan: {
                    auditLogEnabled: true,
                },
            })
            const ctxTwo = await createTestContext(app!)


            const mockAuditEvents1 = [
                createAuditEvent({
                    platformId: ctxOne.platform.id,
                    userId: ctxOne.user.id,
                }),
                createAuditEvent({
                    platformId: ctxOne.platform.id,
                    userId: ctxOne.user.id,
                }),
            ]
            await db.save('audit_event', mockAuditEvents1)

            const mockAuditEvents2 = [
                createAuditEvent({
                    platformId: ctxTwo.platform.id,
                    userId: ctxTwo.user.id,
                }),
                createAuditEvent({
                    platformId: ctxTwo.platform.id,
                    userId: ctxTwo.user.id,
                }),
            ]
            await db.save('audit_event', mockAuditEvents2)

            // act
            const response1 = await ctxOne.get('/v1/audit-events')

            // assert
            expect(response1?.statusCode).toBe(StatusCodes.OK)
            const responseBody1 = response1?.json()

            expect(responseBody1.data).toHaveLength(mockAuditEvents1.length)
            expect(responseBody1?.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id: mockAuditEvents1[0].id }),
                    expect.objectContaining({ id: mockAuditEvents1[1].id }),
                ]),
            )
        })

        it('should return forbidden if the user is not the owner', async () => {
            // arrange
            const ctx = await createTestContext(app!)

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: ctx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,

                platform: { id: ctx.platform.id },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/audit-events',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
