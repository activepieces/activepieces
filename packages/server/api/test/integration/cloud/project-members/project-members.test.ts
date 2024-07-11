import {
    ApiKeyResponseWithValue,
    UpsertProjectMemberRequestBody,
} from '@activepieces/ee-shared'
import { Platform, PlatformRole, PrincipalType, Project, ProjectMemberRole, User } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { stripeHelper } from '../../../../src/app/ee/billing/project-billing/stripe-helper'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection().initialize()
    app = await setupServer()
})

beforeEach(async () => {
    stripeHelper.getOrCreateCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.uuid())
    emailService.sendInvitation = jest.fn()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project Member API', () => {
    describe('Invite member to project Endpoint', () => {
        it('Adds new invited user from api for random project', async () => {
            const { mockApiKey } = await createBasicEnvironment()
            const { mockProject: mockProject2, mockMember } = await createBasicEnvironment()
            
            const mockInviteProjectMemberRequest: UpsertProjectMemberRequestBody = {
                userId: mockMember.id,
                role: ProjectMemberRole.VIEWER,
                projectId: mockProject2.id,
            }
            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Adds new invited user from api', async () => {
            const { mockApiKey, mockProject, mockMember } = await createBasicEnvironment()
            const mockInviteProjectMemberRequest: UpsertProjectMemberRequestBody = {
                userId: mockMember.id,
                role: ProjectMemberRole.VIEWER,
                projectId: mockProject.id,
            }
            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it.each([
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.OPERATOR,
        ])('Fails for user with role %s, only api keys allowed', async (testRole) => {
            const { mockPlatform, mockProject } = await createBasicEnvironment()

            const mockUser = createMockUser({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: {
                    userId: mockProjectMember.userId,
                    role: 'VIEWER',
                    projectId: mockProject.id,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })
    })

    describe('List project members Endpoint', () => {
        describe('List project members from api', () => {
            it('should return project members', async () => {
                const { mockApiKey, mockProject, mockMember } = await createBasicEnvironment()

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject.id,
                    userId: mockMember.id,
                })
                await databaseConnection()
                    .getRepository('project_member')
                    .save(mockProjectMember)

                // act
                const response = await app?.inject({
                    method: 'GET',
                    url: `/v1/project-members?projectId=${mockProject.id}`,
                    headers: {
                        authorization: `Bearer ${mockApiKey.value}`,
                    },
                })
                expect(response?.statusCode).toBe(StatusCodes.OK)
                const responseBody = response?.json()
                expect(responseBody.data).toHaveLength(1)
                expect(responseBody.data[0].id).toBe(mockProjectMember.id)
            })

            it('Lists project members for non owner project', async () => {
                const { mockApiKey, mockMember } = await createBasicEnvironment()
                const { mockProject: mockProject2 } = await createBasicEnvironment()

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject2.id,
                    userId: mockMember.id,
                })
                await databaseConnection()
                    .getRepository('project_member')
                    .save(mockProjectMember)

                // act
                const response = await app?.inject({
                    method: 'GET',
                    url: `/v1/project-members?projectId=${mockProject2.id}`,
                    headers: {
                        authorization: `Bearer ${mockApiKey.value}`,
                    },
                })
                expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            })
        })

        describe('List project members by user', () => {

            it.each([
                ProjectMemberRole.ADMIN,
                ProjectMemberRole.EDITOR,
                ProjectMemberRole.VIEWER,
                ProjectMemberRole.OPERATOR,
            ])('Succeeds if user role is %s', async (testRole) => {
                // arrange
                const { mockPlatform, mockProject, mockMember } = await createBasicEnvironment()

          
                const mockProjectMember = createMockProjectMember({
                    userId: mockMember.id,
                    platformId: mockPlatform.id,
                    projectId: mockProject.id,
                    role: testRole,
                })
                await databaseConnection().getRepository('project_member').save([mockProjectMember])

                const mockToken = await generateMockToken({
                    id: mockMember.id,
                    type: PrincipalType.USER,
                    projectId: mockProject.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                })

                // act
                const response = await app?.inject({
                    method: 'GET',
                    url: `/v1/project-members?projectId=${mockProject.id}`,
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                })

                // assert
                expect(response?.statusCode).toBe(StatusCodes.OK)
            })

        
        })
    })

    describe('Delete project member Endpoint', () => {
        it('Deletes project member', async () => {
            const { mockOwnerToken, mockProject, mockMember } = await createBasicEnvironment()

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                userId: mockMember.id,
            })
            await databaseConnection()
                .getRepository('project_member')
                .save(mockProjectMember)

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it.each([
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.OPERATOR,
        ])('Fails if user role is %s', async (testRole) => {
            // arrange
            const { mockPlatform, mockProject, mockMember } = await createBasicEnvironment()


            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])

            const mockToken = await generateMockToken({
                id: mockMember.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()

            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockMember.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })

        it('Delete project member from api', async () => {
            const { mockApiKey, mockProject, mockMember } = await createBasicEnvironment()

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                userId: mockMember.id,
            })
            await databaseConnection()
                .getRepository('project_member')
                .save(mockProjectMember)

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Delete project member from api for non owner project', async () => {
            const { mockApiKey, mockMember } = await createBasicEnvironment()
            const { mockProject: mockProject2 } = await createBasicEnvironment()

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject2.id,
                platformId: mockProject2.platformId,
                userId: mockMember.id,
            })
            await databaseConnection()
                .getRepository('project_member')
                .save(mockProjectMember)

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})

async function createBasicEnvironment(): Promise<{
    mockOwner: User
    mockPlatform: Platform
    mockProject: Project
    mockApiKey: ApiKeyResponseWithValue
    mockOwnerToken: string
    mockMember: User
}> {
    const mockOwner = createMockUser()
    await databaseConnection().getRepository('user').save(mockOwner)

    const mockPlatform = createMockPlatform({
        ownerId: mockOwner.id,
        projectRolesEnabled: true,
    })
    await databaseConnection().getRepository('platform').save(mockPlatform)

    const mockProject = createMockProject({
        ownerId: mockOwner.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('project').save(mockProject)

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('api_key').save(mockApiKey)


    await databaseConnection().getRepository('user').update(mockOwner.id, {
        platformId: mockPlatform.id,
        platformRole: PlatformRole.ADMIN,
    })
    const mockOwnerToken = await generateMockToken({
        id: mockOwner.id,
        type: PrincipalType.USER,
        projectId: mockProject.id,
        platform: {
            id: mockPlatform.id,
        },
    })

    const mockMember = createMockUser({
        platformId: mockPlatform.id,
        platformRole: PlatformRole.MEMBER,
    })
    await databaseConnection().getRepository('user').save(mockMember)
    
    return {
        mockOwner,
        mockPlatform,
        mockProject,
        mockApiKey,
        mockOwnerToken,
        mockMember,
    }
}
