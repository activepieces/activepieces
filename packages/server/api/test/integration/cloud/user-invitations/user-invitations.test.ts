import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    ApiKeyResponseWithValue,
    DefaultProjectRole,
    InvitationStatus,
    InvitationType,
    Platform,
    PlatformRole,
    PrincipalType,
    Project,
    ProjectRole,
    ProjectType,
    SendUserInvitationRequest,
    User,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockProjectMember,
    createMockUserInvitation,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    emailService(mockLog).sendInvitation = vi.fn()
})

describe('User Invitation API', () => {
    describe('Invite User', () => {
        it('should return invitation link when smtp is not configured', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({})

            const mockInviteProjectMemberRequest: SendUserInvitationRequest = {
                email: faker.internet.email(),
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.ADMIN,
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockApiKey.value}` },
                query: { projectId: mockProject.id },
                body: mockInviteProjectMemberRequest,
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody?.link).toBeUndefined()

            const invitation = await db.findOneBy('user_invitation', { id: responseBody?.id })
            expect((invitation as Record<string, unknown>)?.status).toBe(InvitationStatus.ACCEPTED)
        })

        it('should have status pending when inviting a user', async () => {
            const { mockOwnerToken, mockProject } = await createBasicEnvironment({})

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockOwnerToken}` },
                query: { projectId: mockProject.id },
                body: {
                    email: faker.internet.email(),
                    type: InvitationType.PLATFORM,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            const invitation = await db.findOneBy('user_invitation', { id: responseBody?.id })
            expect((invitation as Record<string, unknown>)?.status).toBe(InvitationStatus.PENDING)
        })

        it('Invite user to Platform Member', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({})

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockApiKey.value}` },
                query: { projectId: mockProject.id },
                body: {
                    email: faker.internet.email(),
                    type: InvitationType.PLATFORM,
                    platformRole: PlatformRole.ADMIN,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Invite user to other platform project should fail', async () => {
            const { mockApiKey } = await createBasicEnvironment({})
            const { mockProject: mockProject2 } = await createBasicEnvironment({})

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockApiKey.value}` },
                body: {
                    projectRole: adminRole.name,
                    email: faker.internet.email(),
                    projectId: mockProject2.id,
                    type: InvitationType.PROJECT,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()?.code).toBe('AUTHORIZATION')
        })

        it('should reject invitation to personal project', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({
                project: { type: ProjectType.PERSONAL },
            })

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockApiKey.value}` },
                body: {
                    projectRole: adminRole.name,
                    email: faker.internet.email(),
                    projectId: mockProject.id,
                    type: InvitationType.PROJECT,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('VALIDATION')
            expect(responseBody?.params?.message).toBe('Project must be a team project')
        })

        it('Invite user to Project Member using api key', async () => {
            const { mockApiKey, mockProject } = await createBasicEnvironment({})

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockApiKey.value}` },
                body: {
                    projectRole: adminRole.name,
                    email: faker.internet.email(),
                    projectId: mockProject.id,
                    type: InvitationType.PROJECT,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Invite user to Project Member', async () => {
            const { mockOwnerToken, mockProject } = await createBasicEnvironment({})
            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockOwnerToken}` },
                body: {
                    projectRole: adminRole.name,
                    email: faker.internet.email(),
                    projectId: mockProject.id,
                    type: InvitationType.PROJECT,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it.each([
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.VIEWER,
        ])('Fails if user role is %s', async (testRole) => {
            const { mockMember, mockProject } = await createBasicEnvironment({})
            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: testRole })

            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockMember.platformId!,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await db.save('project_member', mockProjectMember)

            const mockToken = await generateMockToken({
                id: mockMember.id,
                type: PrincipalType.USER,
                platform: { id: mockProject.platformId },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    projectRole: projectRole.name,
                    email: faker.internet.email(),
                    projectId: mockProject.id,
                    type: InvitationType.PROJECT,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(response?.json()?.code).toBe('PERMISSION_DENIED')
        })
    })

    describe('List User Invitations', () => {
        it('should succeed', async () => {
            const { mockOwnerToken, mockPlatform, mockProject } = await createBasicEnvironment({})

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                projectRole: adminRole,
            })
            await db.save('user_invitation', mockUserInvitation)

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: { type: InvitationType.PROJECT },
                headers: { authorization: `Bearer ${mockOwnerToken}` },
            })
            const responseBody = listResponse?.json()
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.data.length).toBe(1)
        })

        it('should succeed with API key', async () => {
            const { mockApiKey, mockPlatform, mockProject } = await createBasicEnvironment({})
            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                status: InvitationStatus.PENDING,
                projectRole: adminRole,
            })
            await db.save('user_invitation', mockUserInvitation)

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: { type: InvitationType.PROJECT },
                headers: { authorization: `Bearer ${mockApiKey.value}` },
            })
            const responseBody = listResponse?.json()
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.data.length).toBe(1)
        })

        it('should return empty list with API key from another platform', async () => {
            const { mockPlatform, mockProject } = await createBasicEnvironment({})

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: InvitationType.PROJECT,
                projectRole: adminRole,
            })
            await db.save('user_invitation', mockUserInvitation)

            const { mockApiKey: anotherApiKey } = await createBasicEnvironment({})

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: { type: InvitationType.PROJECT },
                headers: { authorization: `Bearer ${anotherApiKey.value}` },
            })
            const responseBody = listResponse?.json()
            expect(listResponse?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.data.length).toBe(0)
        })

        it('should return forbidden when listing invitations for a project owned by another platform using API key', async () => {
            const { mockApiKey: apiKey1 } = await createBasicEnvironment({})
            const { mockProject: project2 } = await createBasicEnvironment({})

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockUserInvitation = createMockUserInvitation({
                email: faker.internet.email(),
                platformId: project2.platformId,
                projectId: project2.id,
                type: InvitationType.PROJECT,
                status: InvitationStatus.PENDING,
                projectRole: adminRole,
            })
            await db.save('user_invitation', mockUserInvitation)

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                query: { projectId: project2.id, type: InvitationType.PROJECT },
                headers: { authorization: `Bearer ${apiKey1.value}` },
            })

            expect(listResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(listResponse?.json()?.code).toBe('AUTHORIZATION')
        })

        it.each([
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.VIEWER,
            DefaultProjectRole.ADMIN,
        ])('Succeed if user role is %s', async (testRole) => {
            const { mockMember, mockProject } = await createBasicEnvironment({})
            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: testRole })

            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockMember.platformId!,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await db.save('project_member', mockProjectMember)

            const mockToken = await generateMockToken({
                id: mockMember.id,
                type: PrincipalType.USER,
                platform: { id: mockProject.platformId },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/user-invitations',
                headers: { authorization: `Bearer ${mockToken}` },
                query: { type: InvitationType.PROJECT },
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
            await db.save('user_invitation', mockUserInvitation)
            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/user-invitations/${mockUserInvitation.id}`,
                headers: { authorization: `Bearer ${mockOwnerToken}` },
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
            await db.save('user_invitation', mockUserInvitation)
            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/user-invitations/${mockUserInvitation.id}`,
                headers: { authorization: `Bearer ${mockApiKey.value}` },
            })
            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })
})

async function createBasicEnvironment({ platform, project }: { platform?: Partial<Platform>, project?: Partial<Project> }): Promise<{
    mockOwner: User
    mockPlatform: Platform
    mockProject: Project
    mockApiKey: ApiKeyResponseWithValue
    mockOwnerToken: string
    mockMember: User
}> {
    const { mockOwner, mockPlatform, mockProject, mockApiKey } = await mockAndSaveBasicSetupWithApiKey({
        platform: { ...platform },
        project: { ...project },
        plan: { projectRolesEnabled: true, auditLogEnabled: false },
    })

    const mockOwnerToken = await generateMockToken({
        id: mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: mockPlatform.id },
    })

    const { mockUser: mockMember } = await mockBasicUser({
        user: {
            platformId: mockPlatform.id,
            platformRole: PlatformRole.MEMBER,
        },
    })

    return { mockOwner, mockPlatform, mockProject, mockApiKey, mockOwnerToken, mockMember }
}
