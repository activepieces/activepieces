import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createAuditEvent,
    createMockPlatform,
    createMockProject,
    createMockUser,
    mockBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Audit Event API', () => {
    describe('List Audit event API', () => {
        it('should list audit events', async () => {
            // arrange
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()
            const { mockOwner: mockUserTwo, mockPlatform: mockPlatformTwo } = await mockBasicSetup()


            await databaseConnection().getRepository('platform').update(mockPlatformOne.id, {
                auditLogEnabled: true,
            })
            const testToken1 = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })

            const mockAuditEvents1 = [
                createAuditEvent({
                    platformId: mockPlatformOne.id,
                    userId: mockUserOne.id,
                }),
                createAuditEvent({
                    platformId: mockPlatformOne.id,
                    userId: mockUserOne.id,
                }),
            ]
            await databaseConnection()
                .getRepository('audit_event')
                .save(mockAuditEvents1)

            const mockAuditEvents2 = [
                createAuditEvent({
                    platformId: mockPlatformTwo.id,
                    userId: mockUserTwo.id,
                }),
                createAuditEvent({
                    platformId: mockPlatformTwo.id,
                    userId: mockUserTwo.id,
                }),
            ]
            await databaseConnection()
                .getRepository('audit_event')
                .save(mockAuditEvents2)

            // act
            const response1 = await app?.inject({
                method: 'GET',
                url: '/v1/audit-events',
                headers: {
                    authorization: `Bearer ${testToken1}`,
                },
            })

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
            const mockUser1 = createMockUser({ platformRole: PlatformRole.ADMIN })
            await databaseConnection().getRepository('user').save(mockUser1)

            const mockPlatform1 = createMockPlatform({ ownerId: mockUser1.id, auditLogEnabled: true })
            await databaseConnection().getRepository('platform').save(mockPlatform1)

            const mockProject1 = createMockProject({
                platformId: mockPlatform1.id,
                ownerId: mockUser1.id,
            })
            await databaseConnection().getRepository('project').save(mockProject1)

            const testToken1 = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser1.id,
                platform: { id: mockPlatform1.id },
            })

            // act
            const response1 = await app?.inject({
                method: 'GET',
                url: '/v1/audit-events',
                headers: {
                    authorization: `Bearer ${testToken1}`,
                },
            })

            // assert
            expect(response1?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
