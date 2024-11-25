import {
    ApiKeyResponseWithValue,
} from '@activepieces/ee-shared'
import { DefaultProjectRole, InvitationStatus, InvitationType, Platform, PlatformRole, PrincipalType, Project, ProjectRole, SendUserInvitationRequest, User } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockUser,
    createMockUserInvitation,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(async () => {
    emailService.sendInvitation = jest.fn()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('User Invitation API', () => {
    describe('Invite User', () => {

        it('should not return invitation link when smtp is configured', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({
                platform: {
                    smtp: {
                        host: faker.internet.domainName(),
                        port: faker.internet.port(),
                        user: faker.internet.email(),
                        password: faker.internet.password(),
                        senderEmail: faker.internet.email(),
                        senderName: faker.internet.userName(),
                    },
                },
            })

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                email: faker.internet.email(),
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                query: {
                    projectId: mockProject.id,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody?.link).toBeUndefined()
        })

        it('should return invitation link when smtp is not configured', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({
                platform: {
                    smtp: undefined,
                },
            })

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                email: faker.internet.email(),
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                query: {
                    projectId: mockProject.id,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody?.link).toBeUndefined()

            const invitationId = responseBody?.id
            const invitation = await databaseConnection().getRepository('user_invitation').findOneBy({ id: invitationId })
            expect(invitation?.status).toBe(InvitationStatus.ACCEPTED)
        })

        it('should have status pending when inviting a user', async () => {
            const { mockOwnerToken, mockProject } = await createBasicEnvironment({})

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                email: faker.internet.email(),
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
                query: {
                    projectId: mockProject.id,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            const invitationId = responseBody?.id
            const invitation = await databaseConnection().getRepository('user_invitation').findOneBy({ id: invitationId })
            expect(invitation?.status).toBe(InvitationStatus.PENDING)
        })

        it('Invite user to Platform Member', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({})

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                email: faker.internet.email(),
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                query: {
                    projectId: mockProject.id,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Invite user to other platform project should fail', async () => {
            const { mockApiKey } = await createBasicEnvironment({})
            const { mockProject: mockProject2 } = await createBasicEnvironment({})

            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: adminRole.name,
                email: faker.internet.email(),
                projectId: mockProject2.id,
                type: InvitationType.PROJECT,
            }

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })

        it('Invite user to Project Member using api key', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({})

            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole
            
            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: adminRole.name,
                email: faker.internet.email(),
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Invite user to Project Member', async () => {
            const { mockOwnerToken, mockProject } = await createBasicEnvironment({})
            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: adminRole.name,
                email: faker.internet.email(),
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it.each([
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.VIEWER,
            DefaultProjectRole.OPERATOR,
        ])('Fails if user role is %s', async (testRole) => {
            const { mockMember, mockProject } = await createBasicEnvironment({})
            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: projectRole.name,
                email: faker.internet.email(),
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
            }
            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockMember.platformId!,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save(mockProjectMember)

            const mockToken = await generateMockToken({
                id: mockMember.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
        })

    })


    describe('List User Invitations', () => {
        it('should succeed', async () => {
            const { mockOwnerToken, mockPlatform, mockProject } = await createBasicEnvironment({})

            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                projectRole: adminRole,
            })
            await databaseConnection().getRepository('user_invitation').save(mockUserInvitation)
            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: {
                    type: InvitationType.PROJECT,
                },
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })
            const responseBody = listResponse?.json()
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.data.length).toBe(1)
        })

        it('should succeed with API key', async () => {
            const { mockApiKey, mockPlatform, mockProject } = await createBasicEnvironment({})
            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                status: InvitationStatus.PENDING,
                projectRole: adminRole,
            })
            await databaseConnection().getRepository('user_invitation').save(mockUserInvitation)
            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: {
                    type: InvitationType.PROJECT,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })
            const responseBody = listResponse?.json()
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.data.length).toBe(1)
        })

        it('should return empty list with API key from another platform', async () => {
            const { mockPlatform, mockProject } = await createBasicEnvironment({})

            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                projectRole: adminRole,
            })
            await databaseConnection().getRepository('user_invitation').save(mockUserInvitation)

            const { mockApiKey: anotherApiKey } = await createBasicEnvironment({})

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: {
                    type: InvitationType.PROJECT,
                },
                headers: {
                    authorization: `Bearer ${anotherApiKey.value}`,
                },
            })
            const responseBody = listResponse?.json()
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.data.length).toBe(0)
        })

        it('should return forbidden when listing invitations for a project owned by another platform using API key', async () => {
            // Create two separate environments
            const { mockApiKey: apiKey1 } = await createBasicEnvironment({})
            const { mockProject: project2 } = await createBasicEnvironment({})

            const adminRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.ADMIN }) as ProjectRole

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: project2.platformId,
                projectId: project2.id,
                type: InvitationType.PROJECT,
                status: InvitationStatus.PENDING,
                projectRole: adminRole,
            })
            await databaseConnection().getRepository('user_invitation').save(mockUserInvitation)

            // Attempt to list invitations for project2 using apiKey1
            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: {
                    projectId: project2.id,
                    type: InvitationType.PROJECT,
                },
                headers: {
                    authorization: `Bearer ${apiKey1.value}`,
                },
            })

            expect(listResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = listResponse?.json()
            expect(responseBody?.code).toBe('AUTHORIZATION')
        })

        it.each([
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.VIEWER,
            DefaultProjectRole.ADMIN,
            DefaultProjectRole.OPERATOR,
        ])('Succeed if user role is %s', async (testRole) => {
            const { mockMember, mockProject } = await createBasicEnvironment({})

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: projectRole.name,
                email: faker.internet.email(),
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
            }
            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockMember.platformId!,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save(mockProjectMember)

            const mockToken = await generateMockToken({
                id: mockMember.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    type: InvitationType.PROJECT,
                },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Delete User Invitation', () => {
        it('Delete User Invitation', async () => {
            const { mockOwnerToken, mockPlatform } = await createBasicEnvironment({})
            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            })
            await databaseConnection().getRepository('user_invitation').save(mockUserInvitation)
            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/user-invitations/${mockUserInvitation.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })
            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Delete User Invitation with API key', async () => {
            const { mockApiKey, mockPlatform } = await createBasicEnvironment({})
            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            })
            await databaseConnection().getRepository('user_invitation').save(mockUserInvitation)
            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/user-invitations/${mockUserInvitation.id}`,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })
            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })
})

async function createBasicEnvironment({ platform }: { platform?: Partial<Platform> }): Promise<{
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
        ...platform,
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
