import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { stripeHelper } from '../../../../src/app/ee/billing/project-billing/stripe-helper'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockUser,
    mockBasicSetup,
} from '../../../helpers/mocks'
import {
    AddProjectMemberRequestBody,
    ApiKeyResponseWithValue,
    ProjectMemberStatus,
} from '@activepieces/ee-shared'
import { Platform, PlatformRole, PrincipalType, Project, ProjectMemberRole, User } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(async () => {
    stripeHelper.getOrCreateCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.uuid())
    emailService.sendInvitation = jest.fn()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Project Member API', () => {
    describe('Invite member to project Endpoint', () => {
        it('Adds new invited user from api for random project', async () => {
            const { mockApiKey } = await createBasicEnvironment()
            const { mockProject: mockProject2 } = await createBasicEnvironment()
            await databaseConnection.getRepository('project').save(mockProject2)

            const mockInviteProjectMemberRequest: AddProjectMemberRequestBody = {
                email: 'test@ap.com',
                role: ProjectMemberRole.VIEWER,
                projectId: mockProject2.id,
                status: ProjectMemberStatus.ACTIVE,
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
            const { mockApiKey, mockProject } = await createBasicEnvironment()
            const mockInviteProjectMemberRequest: AddProjectMemberRequestBody = {
                email: 'test@ap.com',
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

        it('Adds new invited user', async () => {
            const { mockUserToken, mockProject } = await createBasicEnvironment()

            const randomEmail = faker.internet.email()
            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: {
                    email: randomEmail,
                    role: 'VIEWER',
                    projectId: mockProject.id,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(Object.keys(responseBody)).toHaveLength(8)

            expect(emailService.sendInvitation).toBeCalledTimes(1)

            const projectMember = await databaseConnection
                .getRepository('project_member')
                .findOneBy({
                    email: randomEmail,
                    projectId: mockProject.id,
                })

            expect(projectMember?.status).toBe('PENDING')
        })

        it('Auto activates membership if status is set to ACTIVE with embeddedEnabled', async () => {
            const { mockUserToken, mockProject } = await createBasicEnvironment(true)
            // act
            const randomEmail = faker.internet.email()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: {
                    email: randomEmail,
                    role: 'VIEWER',
                    status: ProjectMemberStatus.ACTIVE,
                    projectId: mockProject.id,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody?.status).toBe('ACTIVE')
        })

        it('Skips sending invitation email if membership is ACTIVE', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockBasicSetup({
                platform: {
                    embeddingEnabled: true,
                },
            })

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockInviteProjectMemberRequest = {
                email: 'test@ap.com',
                role: 'VIEWER',
                projectId: mockProject.id,
                status: ProjectMemberStatus.ACTIVE,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockInviteProjectMemberRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)

            expect(emailService.sendInvitation).not.toBeCalled()
        })

        it.each([
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Fails if user role is %s', async (testRole) => {
            const { mockPlatform, mockProject } = await createBasicEnvironment()

            const mockUser = createMockUser({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
            await databaseConnection.getRepository('user').save(mockUser)

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
                },
            })

            const randomEmail = faker.internet.email()
            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: {
                    email: randomEmail,
                    role: 'VIEWER',
                    projectId: mockProject.id,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockUser.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })
    })

    describe('List project members Endpoint', () => {
        describe('List project members from api', () => {
            it('Lists project members', async () => {
                const { mockApiKey, mockProject } = await createBasicEnvironment()
                const randomEmail = faker.internet.email()

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject.id,
                    email: randomEmail,
                })
                await databaseConnection
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
                expect(responseBody.data).toHaveLength(2)
                expect(responseBody.data[1].id).toBe(mockProjectMember.id)
            })

            it('Lists project members for non owner project', async () => {
                const { mockApiKey } = await createBasicEnvironment()
                const { mockProject: mockProject2 } = await createBasicEnvironment()
                const randomEmail = faker.internet.email()

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject2.id,
                    email: randomEmail,
                })
                await databaseConnection
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
            ])('Succeeds if user role is %s', async (testRole) => {
                // arrange
                const { mockPlatform, mockProject } = await createBasicEnvironment()

                const mockUser = createMockUser({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
                await databaseConnection.getRepository('user').save(mockUser)

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

            it('Fails if user role is EXTERNAL_CUSTOMER', async () => {
                // arrange
                const { mockPlatform, mockProject } = await createBasicEnvironment()

                const mockUser = createMockUser({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
                await databaseConnection.getRepository('user').save(mockUser)

                const mockProjectMember = createMockProjectMember({
                    email: mockUser.email,
                    platformId: mockPlatform.id,
                    projectId: mockProject.id,
                    role: ProjectMemberRole.EXTERNAL_CUSTOMER,
                })
                await databaseConnection.getRepository('project_member').save([mockProjectMember])

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
                    method: 'GET',
                    url: `/v1/project-members?projectId=${mockProject.id}`,
                    headers: {
                        authorization: `Bearer ${mockToken}`,
                    },
                })

                // assert
                expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

                const responseBody = response?.json()
                expect(responseBody?.code).toBe('PERMISSION_DENIED')
                expect(responseBody?.params?.userId).toBe(mockUser.id)
                expect(responseBody?.params?.projectId).toBe(mockProject.id)
            })
        })
    })

    describe('Delete project member Endpoint', () => {
        it('Deletes project member', async () => {
            const { mockUserToken, mockProject } = await createBasicEnvironment()
            const randomEmail = faker.internet.email()

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                email: randomEmail,
            })
            await databaseConnection
                .getRepository('project_member')
                .save(mockProjectMember)

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it.each([
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Fails if user role is %s', async (testRole) => {
            // arrange
            const { mockPlatform, mockProject } = await createBasicEnvironment()

            const mockUser = createMockUser({ platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
            await databaseConnection.getRepository('user').save(mockUser)

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
            expect(responseBody?.params?.userId).toBe(mockUser.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })

        it('Delete project member from api', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment()
            const randomEmail = faker.internet.email()

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                email: randomEmail,
            })
            await databaseConnection
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
            const { mockApiKey } = await createBasicEnvironment()
            const { mockProject: mockProject2 } = await createBasicEnvironment()
            const randomEmail = faker.internet.email()

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject2.id,
                email: randomEmail,
            })
            await databaseConnection
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

async function createBasicEnvironment(
    embeddingEnabled = false,
): Promise<{
        mockUser: User
        mockPlatform: Platform
        mockProject: Project
        mockApiKey: ApiKeyResponseWithValue
        mockUserToken: string
    }> {
    const mockUser = createMockUser()
    await databaseConnection.getRepository('user').save(mockUser)

    const mockPlatform = createMockPlatform({
        ownerId: mockUser.id,
        embeddingEnabled,
    })
    await databaseConnection.getRepository('platform').save(mockPlatform)

    const mockProject = createMockProject({
        ownerId: mockUser.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection.getRepository('project').save(mockProject)

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await databaseConnection.getRepository('api_key').save(mockApiKey)


    await databaseConnection.getRepository('user').update(mockUser.id, {
        platformId: mockPlatform.id,
        platformRole: PlatformRole.ADMIN,
    })
    const mockUserToken = await generateMockToken({
        id: mockUser.id,
        type: PrincipalType.USER,
        projectId: mockProject.id,
        platform: {
            id: mockPlatform.id,
        },
    })
    return {
        mockUser,
        mockPlatform,
        mockProject,
        mockApiKey,
        mockUserToken,
    }
}
