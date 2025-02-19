import {
    ApiKeyResponseWithValue,
    UpdateProjectMemberRoleRequestBody,
} from '@activepieces/ee-shared'
import { DefaultProjectRole, Permission, Platform, PlatformRole, PrincipalType, Project, ProjectRole, RoleType, User } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { stripeHelper } from '../../../../src/app/ee/platform-billing/stripe-helper'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockProject,
    createMockProjectMember,
    createMockProjectRole,
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    mockLog = app!.log!
})

beforeEach(async () => {
    stripeHelper(mockLog).createCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.uuid())
    emailService(mockLog).sendInvitation = jest.fn()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project Member API', () => {


    describe('Update project member role', () => {
        it('should update a project role for a member', async () => {
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne, mockProject: mockProjectOne } = await mockAndSaveBasicSetup({
                platform: {
                    projectRolesEnabled: true,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                projectId: mockProjectOne.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatformOne.id, type: RoleType.CUSTOM, permissions: [Permission.WRITE_PROJECT_MEMBER] })
            await databaseConnection().getRepository('project_role').save(projectRole)

            const mockProjectMemberOne = createMockProjectMember({ platformId: mockPlatformOne.id, projectId: mockProjectOne.id, projectRoleId: projectRole.id, userId: mockUserOne.id })
            await databaseConnection().getRepository('project_member').save(mockProjectMemberOne)

            const request: UpdateProjectMemberRoleRequestBody = {
                role: 'VIEWER',
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-members/${mockProjectMemberOne.id}`,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail to update project role when user does not have permission', async () => {
            const { mockPlatform: mockPlatformOne, mockProject: mockProjectOne } = await mockAndSaveBasicSetup()
            
            // Create a user who is not in the project
            const { mockUser: viewerUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatformOne.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: viewerUser.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ 
                name: DefaultProjectRole.VIEWER,
            }) as ProjectRole

            // Create a project member to try to modify
            const mockProjectMember = createMockProjectMember({ 
                platformId: mockPlatformOne.id, 
                projectId: mockProjectOne.id, 
                projectRoleId: projectRole.id,
                userId: viewerUser.id,
            })
            await databaseConnection().getRepository('project_member').save(mockProjectMember)

            const request: UpdateProjectMemberRoleRequestBody = {
                role: DefaultProjectRole.ADMIN,
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-members/${mockProjectMember.id}`,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should fail to update project role when user is admin of another project', async () => {
            // Create first project with its platform
            const { mockProject: projectOne, mockPlatform } = await mockAndSaveBasicSetup()
            
            // Create second project admin
            const { mockUser: adminOfProjectTwo } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectTwo = createMockProject({
                ownerId: adminOfProjectTwo.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save(projectTwo)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: adminOfProjectTwo.id,
                platform: { id: mockPlatform.id },
            })

            // Create member in first project to try to modify
            const { mockUser: memberToModify } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const viewerRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ 
                name: DefaultProjectRole.VIEWER,
            }) as ProjectRole

            const projectMember = createMockProjectMember({ 
                platformId: mockPlatform.id, 
                projectId: projectOne.id, 
                projectRoleId: viewerRole.id,
                userId: memberToModify.id,
            })
            await databaseConnection().getRepository('project_member').save(projectMember)

            const request: UpdateProjectMemberRoleRequestBody = {
                role: DefaultProjectRole.ADMIN,
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-members/${projectMember.id}`,
                body: request,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('List project members Endpoint', () => {
        describe('List project members from api', () => {
            it('should return project members', async () => {
                const { mockApiKey, mockProject, mockMember, mockPlatform } = await createBasicEnvironment()

                const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.VIEWER }) as ProjectRole

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject.id,
                    userId: mockMember.id,
                    projectRoleId: projectRole.id,
                    platformId: mockPlatform.id,
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
                const { mockProject: mockProject2 } = await mockAndSaveBasicSetup()

                const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.VIEWER }) as ProjectRole

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject2.id,
                    userId: mockMember.id,
                    projectRoleId: projectRole.id,
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
                DefaultProjectRole.ADMIN,
                DefaultProjectRole.EDITOR,
                DefaultProjectRole.VIEWER,
                DefaultProjectRole.OPERATOR,
            ])('Succeeds if user role is %s', async (testRole) => {
                // arrange
                const { mockPlatform, mockProject, mockMember } = await createBasicEnvironment()

                const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

                const mockProjectMember = createMockProjectMember({
                    userId: mockMember.id,
                    platformId: mockPlatform.id,
                    projectId: mockProject.id,
                    projectRoleId: projectRole.id,
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

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                userId: mockMember.id,
                projectRoleId: projectRole.id,
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
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.VIEWER,
            DefaultProjectRole.OPERATOR,
        ])('Fails if user role is %s', async (testRole) => {
            // arrange
            const { mockPlatform, mockProject, mockMember } = await createBasicEnvironment()

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
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

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                userId: mockMember.id,
                projectRoleId: projectRole.id,
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
            const { mockProject: mockProject2 } = await mockAndSaveBasicSetup()

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject2.id,
                platformId: mockProject2.platformId,
                userId: mockMember.id,
                projectRoleId: projectRole.id,
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
    const { mockOwner, mockPlatform, mockProject, mockApiKey } = await mockAndSaveBasicSetupWithApiKey({
        platform: {
            projectRolesEnabled: true,
        },
    })


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

    const { mockUser: mockMember } = await mockBasicUser({
        user: {
            platformId: mockPlatform.id,
            platformRole: PlatformRole.MEMBER,
        },
    })

    return {
        mockOwner,
        mockPlatform,
        mockProject,
        mockApiKey,
        mockOwnerToken,
        mockMember,
    }
}
