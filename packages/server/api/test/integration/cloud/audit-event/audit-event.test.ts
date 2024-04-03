import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockUser,
    createMockPlatform,
    createAuditEvent,
    createMockProject,
} from '../../../helpers/mocks'
import { PlatformRole, PrincipalType } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Audit Event API', () => {
    describe('List Audit event API', () => {
        it('should list audit events', async () => {
            // arrange
            const mockUser1 = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser1)

            const mockPlatform1 = createMockPlatform({
                ownerId: mockUser1.id,
                auditLogEnabled: true,
            })
            await databaseConnection.getRepository('platform').save(mockPlatform1)

            const mockProject1 = createMockProject({
                platformId: mockPlatform1.id,
                ownerId: mockUser1.id,
            })
            await databaseConnection.getRepository('project').save(mockProject1)

            const mockUser2 = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser2)

            const mockPlatform2 = createMockPlatform({ ownerId: mockUser2.id })
            await databaseConnection.getRepository('platform').save(mockPlatform2)

            const mockProject2 = createMockProject({
                platformId: mockPlatform2.id,
                ownerId: mockUser2.id,
            })
            await databaseConnection.getRepository('project').save(mockProject2)

            const testToken1 = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser1.id,
                platform: { id: mockPlatform1.id, role: PlatformRole.OWNER },
            })

            const mockAuditEvents1 = [
                createAuditEvent({
                    platformId: mockPlatform1.id,
                    userId: mockUser1.id,
                }),
                createAuditEvent({
                    platformId: mockPlatform1.id,
                    userId: mockUser1.id,
                }),
            ]
            await databaseConnection
                .getRepository('audit_event')
                .save(mockAuditEvents1)

            const mockAuditEvents2 = [
                createAuditEvent({
                    platformId: mockPlatform2.id,
                    userId: mockUser2.id,
                }),
                createAuditEvent({
                    platformId: mockPlatform2.id,
                    userId: mockUser2.id,
                }),
            ]
            await databaseConnection
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
            const mockUser1 = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser1)

            const mockPlatform1 = createMockPlatform({ ownerId: mockUser1.id })
            await databaseConnection.getRepository('platform').save(mockPlatform1)

            const mockProject1 = createMockProject({
                platformId: mockPlatform1.id,
                ownerId: mockUser1.id,
            })
            await databaseConnection.getRepository('project').save(mockProject1)

            const testToken1 = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser1.id,
                platform: { id: mockPlatform1.id, role: PlatformRole.MEMBER },
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
