import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { PlatformRole, PrincipalType, ProjectMemberRole, apId } from '@activepieces/shared'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUser, createMockPlatform, createMockProject, createMockActivity, createMockProjectMember } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Activity API', () => {
    describe('List Activities endpoint', () => {
        it('Sorts by created desc', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockActivity1 = createMockActivity({ projectId: mockProject.id, created: '1999-01-01T00:00:00.000Z' })
            const mockActivity2 = createMockActivity({ projectId: mockProject.id, created: '2111-01-01T00:00:00.000Z' })
            await databaseConnection.getRepository('activity').save([mockActivity1, mockActivity2])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    projectId: mockProject.id,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const responseBody = response?.json()

            expect(responseBody?.data.length).toBe(2)
            expect(responseBody?.data?.[0]?.id).toBe(mockActivity2.id)
            expect(responseBody?.data?.[1]?.id).toBe(mockActivity1.id)
        })

        it('Filters by projectId', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject1 = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            const mockProject2 = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save([mockProject1, mockProject2])

            const mockActivity1 = createMockActivity({ projectId: mockProject1.id })
            const mockActivity2 = createMockActivity({ projectId: mockProject2.id })
            await databaseConnection.getRepository('activity').save([mockActivity1, mockActivity2])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject1.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    projectId: mockProject1.id,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const responseBody = response?.json()

            expect(responseBody?.data?.length).toBe(1)
            expect(responseBody?.data?.[0]?.id).toBe(mockActivity1.id)
        })

        it('Forbids access to projects other than principal\'s', async () => {
            // arrange
            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.USER,
                projectId: apId(),
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    projectId: apId(),
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.params?.message).toBe('invalid project id')
        })

        it('Forbids access to principal types other than USER', async () => {
            // arrange
            const mockProjectId = apId()

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProjectId,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    projectId: mockProjectId,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.params?.message).toBe('invalid route for principal type')
        })

        it.each([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
            await databaseConnection.getRepository('user').save([mockOwner, mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject])

            const mockProjectMember = createMockProjectMember({
                email: mockUser.email,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection.getRepository('project_member').save([mockProjectMember])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                    role: PlatformRole.MEMBER,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    projectId: mockProject.id,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })
})
