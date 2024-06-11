import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockUser,
    createMockUserInvitation,
} from '../../../helpers/mocks'
import {
    ApiKeyResponseWithValue,
} from '@activepieces/ee-shared'
import { InvitationType, Platform, PlatformRole, PrincipalType, Project, ProjectMemberRole, SendUserInvitationRequest, User } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(async () => {
    emailService.sendInvitation = jest.fn()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('User Invitation API', () => {
    describe('Invite User', () => {
        it('Invite user to Platform Member', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment()
            
            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: ProjectMemberRole.ADMIN,
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

        it('Invite user to Project Member', async () => {
            const { mockOwnerToken } = await createBasicEnvironment()
            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: ProjectMemberRole.ADMIN,
                email: faker.internet.email(),
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
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.OPERATOR,
        ])('Fails if user role is %s', async (testRole) => {
            const { mockMember, mockProject } = await createBasicEnvironment()
            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: ProjectMemberRole.EDITOR,
                email: faker.internet.email(),
                type: InvitationType.PROJECT,
            }
            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockMember.platformId!,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection.getRepository('project_member').save(mockProjectMember)

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
            const { mockOwnerToken, mockPlatform, mockProject } = await createBasicEnvironment()
            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                projectRole: ProjectMemberRole.ADMIN,
            })
            await databaseConnection.getRepository('user_invitation').save(mockUserInvitation)
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

        it.each([
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.OPERATOR,
        ])('Succeed if user role is %s', async (testRole) => {
            const { mockMember, mockProject } = await createBasicEnvironment()
            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                projectRole: ProjectMemberRole.EDITOR,
                email: faker.internet.email(),
                type: InvitationType.PROJECT,
            }
            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockMember.platformId!,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection.getRepository('project_member').save(mockProjectMember)

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
            const { mockOwnerToken, mockPlatform } = await createBasicEnvironment()
            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            })
            await databaseConnection.getRepository('user_invitation').save(mockUserInvitation)
            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/user-invitations/${mockUserInvitation.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })
            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)
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
    await databaseConnection.getRepository('user').save(mockOwner)

    const mockPlatform = createMockPlatform({
        ownerId: mockOwner.id,
        projectRolesEnabled: true,
    })
    await databaseConnection.getRepository('platform').save(mockPlatform)

    const mockProject = createMockProject({
        ownerId: mockOwner.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection.getRepository('project').save(mockProject)

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await databaseConnection.getRepository('api_key').save(mockApiKey)


    await databaseConnection.getRepository('user').update(mockOwner.id, {
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
    await databaseConnection.getRepository('user').save(mockMember)
    
    return {
        mockOwner,
        mockPlatform,
        mockProject,
        mockApiKey,
        mockOwnerToken,
        mockMember,
    }
}
