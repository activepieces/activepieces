import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
    Permission,
    PlatformRole,
    PrincipalType,
    ProjectRole,
    RoleType,
    UpdateProjectMemberRoleRequestBody,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockProject,
    createMockProjectMember,
    createMockProjectRole,
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'
import { describeRolePermissions } from '../../../helpers/permission-test'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Project Member API', () => {
    describe('Update project member role', () => {
        it('should update a project role for a member', async () => {
            const ctx = await createTestContext(app!, {
                plan: { projectRolesEnabled: true, auditLogEnabled: false },
            })

            const projectRole = createMockProjectRole({
                platformId: ctx.platform.id,
                type: RoleType.CUSTOM,
                permissions: [Permission.WRITE_PROJECT_MEMBER],
            })
            await db.save('project_role', projectRole)

            const mockProjectMember = createMockProjectMember({
                platformId: ctx.platform.id,
                projectId: ctx.project.id,
                projectRoleId: projectRole.id,
                userId: ctx.user.id,
            })
            await db.save('project_member', mockProjectMember)

            const request: UpdateProjectMemberRoleRequestBody = {
                role: 'VIEWER',
            }

            const response = await ctx.post(`/v1/project-members/${mockProjectMember.id}`, request)
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail to update project role when user does not have permission', async () => {
            const { mockPlatform: mockPlatformOne, mockProject: mockProjectOne } = await mockAndSaveBasicSetup({
                plan: { projectRolesEnabled: true, auditLogEnabled: false },
            })

            const { mockUser: viewerUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatformOne.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockProjectTwo = createMockProject({
                platformId: mockPlatformOne.id,
                ownerId: viewerUser.id,
            })
            await db.save('project', mockProjectTwo)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: viewerUser.id,
                platform: { id: mockPlatformOne.id },
            })

            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', {
                name: DefaultProjectRole.VIEWER,
            })

            const mockProjectMember = createMockProjectMember({
                platformId: mockPlatformOne.id,
                projectId: mockProjectOne.id,
                projectRoleId: projectRole.id,
                userId: viewerUser.id,
            })
            await db.save('project_member', mockProjectMember)

            const request: UpdateProjectMemberRoleRequestBody = {
                role: DefaultProjectRole.ADMIN,
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-members/${mockProjectMember.id}`,
                body: request,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should fail to update project role when user is admin of another project', async () => {
            const { mockProject: projectOne, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { projectRolesEnabled: true, auditLogEnabled: false },
            })

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
            await db.save('project', projectTwo)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: adminOfProjectTwo.id,
                platform: { id: mockPlatform.id },
            })

            const { mockUser: memberToModify } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', {
                name: DefaultProjectRole.VIEWER,
            })

            const projectMember = createMockProjectMember({
                platformId: mockPlatform.id,
                projectId: projectOne.id,
                projectRoleId: viewerRole.id,
                userId: memberToModify.id,
            })
            await db.save('project_member', projectMember)

            const request: UpdateProjectMemberRoleRequestBody = {
                role: DefaultProjectRole.ADMIN,
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/project-members/${projectMember.id}`,
                body: request,
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('List project members Endpoint', () => {
        describe('List project members from api', () => {
            it('should return project members', async () => {
                const { mockApiKey, mockProject, mockMember, mockPlatform } = await createBasicEnvironment()

                const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject.id,
                    userId: mockMember.id,
                    projectRoleId: projectRole.id,
                    platformId: mockPlatform.id,
                })
                await db.save('project_member', mockProjectMember)

                const response = await app?.inject({
                    method: 'GET',
                    url: `/v1/project-members?projectId=${mockProject.id}`,
                    headers: { authorization: `Bearer ${mockApiKey.value}` },
                })
                expect(response?.statusCode).toBe(StatusCodes.OK)
                const responseBody = response?.json()
                expect(responseBody.data).toHaveLength(1)
                expect(responseBody.data[0].id).toBe(mockProjectMember.id)
            })

            it('Lists project members for non owner project', async () => {
                const { mockApiKey, mockMember } = await createBasicEnvironment()
                const { mockProject: mockProject2 } = await mockAndSaveBasicSetup({
                    plan: { projectRolesEnabled: true, auditLogEnabled: false },
                })

                const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

                const mockProjectMember = createMockProjectMember({
                    projectId: mockProject2.id,
                    userId: mockMember.id,
                    projectRoleId: projectRole.id,
                })
                await db.save('project_member', mockProjectMember)

                const response = await app?.inject({
                    method: 'GET',
                    url: `/v1/project-members?projectId=${mockProject2.id}`,
                    headers: { authorization: `Bearer ${mockApiKey.value}` },
                })
                expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            })
        })

        describe('List project members by user', () => {
            describeRolePermissions({
                app: () => app!,
                request: (memberCtx, ownerCtx) => {
                    return memberCtx.get(`/v1/project-members?projectId=${ownerCtx.project.id}`)
                },
                allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR, DefaultProjectRole.VIEWER],
                forbiddenRoles: [],
            })
        })
    })

    describe('Delete project member Endpoint', () => {
        it('Deletes project member', async () => {
            const ctx = await createTestContext(app!, {
                plan: { projectRolesEnabled: true, auditLogEnabled: false },
            })
            const { mockUser: mockMember } = await mockBasicUser({
                user: {
                    platformId: ctx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockProjectMember = createMockProjectMember({
                projectId: ctx.project.id,
                userId: mockMember.id,
                projectRoleId: projectRole.id,
            })
            await db.save('project_member', mockProjectMember)

            const response = await ctx.delete(`/v1/project-members/${mockProjectMember.id}`)
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it.each([
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.VIEWER,
        ])('Fails if user role is %s', async (testRole) => {
            const { mockPlatform, mockProject, mockMember } = await createBasicEnvironment()

            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: testRole })

            const mockProjectMember = createMockProjectMember({
                userId: mockMember.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await db.save('project_member', mockProjectMember)

            const mockToken = await generateMockToken({
                id: mockMember.id,
                type: PrincipalType.USER,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: { authorization: `Bearer ${mockToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockMember.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })

        it('Delete project member from api', async () => {
            const { mockApiKey, mockProject, mockMember } = await createBasicEnvironment()

            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                userId: mockMember.id,
                projectRoleId: projectRole.id,
            })
            await db.save('project_member', mockProjectMember)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: { authorization: `Bearer ${mockApiKey.value}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Delete project member from api for non owner project', async () => {
            const { mockApiKey, mockMember } = await createBasicEnvironment()
            const { mockProject: mockProject2 } = await mockAndSaveBasicSetup({
                plan: { projectRolesEnabled: true, auditLogEnabled: false },
            })

            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject2.id,
                platformId: mockProject2.platformId,
                userId: mockMember.id,
                projectRoleId: projectRole.id,
            })
            await db.save('project_member', mockProjectMember)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/project-members/${mockProjectMember.id}`,
                headers: { authorization: `Bearer ${mockApiKey.value}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})

async function createBasicEnvironment() {
    const { mockOwner, mockPlatform, mockProject, mockApiKey } = await mockAndSaveBasicSetupWithApiKey({
        plan: { projectRolesEnabled: true, auditLogEnabled: false },
    })

    await db.update('user', mockOwner.id, {
        platformId: mockPlatform.id,
        platformRole: PlatformRole.ADMIN,
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
