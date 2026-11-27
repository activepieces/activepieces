import { apId, ProjectRole, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformRole, PrincipalType, UpdateProjectRoleRequestBody } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockProjectRole, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { createMemberContext, createServiceContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Project Role API', () => {
    describe('Create Project Role', () => {
        it('should create a new project role', async () => {
            const ctx = await createTestContext(app!)

            const projectRole = createMockProjectRole({ platformId: ctx.platform.id })

            const response = await ctx.post('/v1/project-roles', projectRole as unknown as Record<string, unknown>)

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json() as ProjectRole
            expect(responseBody.id).toBeDefined()
            expect(responseBody.platformId).toBe(ctx.platform.id)
            expect(responseBody.name).toBe(projectRole.name)
            expect(responseBody.permissions).toEqual(projectRole.permissions)
        })

        it('should fail to create a new project role if user is not platform owner', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatform.id })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/project-roles',
                body: projectRole,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Get Project Role', () => {
        it('should get all project roles', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/project-roles')
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should able to get all project roles if user is not platform owner', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/project-roles',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Update Project Role', () => {
        it('should update a project role', async () => {
            const ctx = await createTestContext(app!)

            const projectRole = createMockProjectRole({ platformId: ctx.platform.id })
            await db.save('project_role', projectRole)

            const request: UpdateProjectRoleRequestBody = {
                name: faker.lorem.word(),
                permissions: ['read', 'write'],
            }

            const response = await ctx.post(`/v1/project-roles/${projectRole.id}`, request as unknown as Record<string, unknown>)
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should refuse a rename onto a name another role already holds', async () => {
            const ctx = await createTestContext(app!)

            const taken = createMockProjectRole({ platformId: ctx.platform.id })
            const renamed = createMockProjectRole({ platformId: ctx.platform.id })
            await db.save('project_role', taken)
            await db.save('project_role', renamed)

            const request: UpdateProjectRoleRequestBody = { name: taken.name }
            const response = await ctx.post(`/v1/project-roles/${renamed.id}`, request as unknown as Record<string, unknown>)

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            const stillThere = await db.findOneBy('project_role', { id: renamed.id }) as ProjectRole | null
            expect(stillThere?.name).toBe(renamed.name)
        })

        it('should refuse a rename that differs from a taken name only by case', async () => {
            const ctx = await createTestContext(app!)

            const taken = createMockProjectRole({ platformId: ctx.platform.id, name: 'Manager' })
            const renamed = createMockProjectRole({ platformId: ctx.platform.id, name: 'Engineer' })
            await db.save('project_role', taken)
            await db.save('project_role', renamed)

            const request: UpdateProjectRoleRequestBody = { name: 'MANAGER' }
            const response = await ctx.post(`/v1/project-roles/${renamed.id}`, request as unknown as Record<string, unknown>)

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            const stillThere = await db.findOneBy('project_role', { id: renamed.id }) as ProjectRole | null
            expect(stillThere?.name).toBe(renamed.name)
        })

        it('should allow saving a role under the name it already has', async () => {
            const ctx = await createTestContext(app!)

            const projectRole = createMockProjectRole({ platformId: ctx.platform.id })
            await db.save('project_role', projectRole)

            const request: UpdateProjectRoleRequestBody = { name: projectRole.name, permissions: ['read'] }
            const response = await ctx.post(`/v1/project-roles/${projectRole.id}`, request as unknown as Record<string, unknown>)

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail to update if user is not platform owner', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatform.id })
            await db.save('project_role', projectRole)

            const request: UpdateProjectRoleRequestBody = {
                name: faker.lorem.word(),
                permissions: ['read', 'write'],
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/project-roles/${projectRole.id}`,
                body: request,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Delete Project Role', () => {
        it('should delete a project role', async () => {
            const ctx = await createTestContext(app!)

            const projectRole = createMockProjectRole({ platformId: ctx.platform.id })
            await db.save('project_role', projectRole)

            const response = await ctx.delete(`/v1/project-roles/${projectRole.name}`)
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail to delete a project role if user is not platform owner', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatform.id })
            await db.save('project_role', projectRole)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/project-roles/${projectRole.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should fail to delete a project role if project role does not exist', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.delete(`/v1/project-roles/${faker.string.uuid()}`)
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('Get Project Role By Id', () => {
        it('should return a custom role of the caller platform', async () => {
            const ctx = await createTestContext(app!)
            const customRole = createMockProjectRole({ platformId: ctx.platform.id, type: RoleType.CUSTOM, name: faker.string.alphanumeric(16) })
            await db.save('project_role', customRole)

            const response = await ctx.get(`/v1/project-roles/${customRole.id}`)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(customRole.id)
        })

        it('should return a default role', async () => {
            const ctx = await createTestContext(app!)
            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const response = await ctx.get(`/v1/project-roles/${viewerRole.id}`)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(viewerRole.id)
        })

        it('should not return a custom role of another platform', async () => {
            const ownerCtx = await createTestContext(app!)
            const otherCtx = await createTestContext(app!)
            const foreignRole = createMockProjectRole({ platformId: ownerCtx.platform.id, type: RoleType.CUSTOM, name: faker.string.alphanumeric(16) })
            await db.save('project_role', foreignRole)

            const response = await otherCtx.get(`/v1/project-roles/${foreignRole.id}`)

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('List Project Members For Project Role', () => {
        it('should list members of the role for a platform admin', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const memberCtx = await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const response = await ownerCtx.get(`/v1/project-roles/${viewerRole.id}/project-members`, { limit: '100' })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const userIds = response.json().data.map((member: { userId: string }) => member.userId)
            expect(userIds).toContain(memberCtx.user.id)
        })

        it('should list members of the role for a platform api key', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const memberCtx = await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
            const serviceCtx = await createServiceContext(app!, ownerCtx)
            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const response = await serviceCtx.get(`/v1/project-roles/${viewerRole.id}/project-members`, { limit: '100' })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const userIds = response.json().data.map((member: { userId: string }) => member.userId)
            expect(userIds).toContain(memberCtx.user.id)
        })

        it('should forbid a platform member', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const memberCtx = await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const response = await memberCtx.get(`/v1/project-roles/${viewerRole.id}/project-members`, { limit: '100' })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should forbid a platform member with no project membership', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.EDITOR })
            const { mockUser: outsider } = await mockBasicUser({
                user: {
                    platformId: ownerCtx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const outsiderToken = await generateMockToken({
                type: PrincipalType.USER,
                id: outsider.id,
                platform: { id: ownerCtx.platform.id },
            })
            const editorRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.EDITOR })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/project-roles/${editorRole.id}/project-members?limit=100`,
                headers: { authorization: `Bearer ${outsiderToken}` },
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should not list members of another platform', async () => {
            const platformOne = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const memberCtx = await createMemberContext(app!, platformOne, { projectRole: DefaultProjectRole.ADMIN })
            const platformTwo = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })

            const response = await platformTwo.get(`/v1/project-roles/${adminRole.id}/project-members`, { limit: '100' })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const userIds = response.json().data.map((member: { userId: string }) => member.userId)
            expect(userIds).not.toContain(memberCtx.user.id)
        })

        it('should forbid a platform operator', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const { mockUser: operator } = await mockBasicUser({
                user: {
                    platformId: ownerCtx.platform.id,
                    platformRole: PlatformRole.OPERATOR,
                },
            })
            const operatorToken = await generateMockToken({
                type: PrincipalType.USER,
                id: operator.id,
                platform: { id: ownerCtx.platform.id },
            })
            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/project-roles/${viewerRole.id}/project-members`,
                headers: { authorization: `Bearer ${operatorToken}` },
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should return no members for a custom role of another platform', async () => {
            const platformOne = await createTestContext(app!, { plan: { projectRolesEnabled: true, customRolesEnabled: true } })
            const foreignRole = createMockProjectRole({ platformId: platformOne.platform.id, type: RoleType.CUSTOM, name: faker.string.alphanumeric(16) })
            await db.save('project_role', foreignRole)
            await createMemberContext(app!, platformOne, { projectRole: foreignRole.name })
            const platformTwo = await createTestContext(app!, { plan: { projectRolesEnabled: true } })

            const response = await platformTwo.get(`/v1/project-roles/${foreignRole.id}/project-members`, { limit: '100' })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().data).toHaveLength(0)
        })

        it('should page through members for a platform admin', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const firstMember = await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
            const secondMember = await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const firstPage = await ownerCtx.get(`/v1/project-roles/${viewerRole.id}/project-members`, { limit: '1' })
            expect(firstPage.statusCode).toBe(StatusCodes.OK)
            expect(firstPage.json().data).toHaveLength(1)
            expect(firstPage.json().next).toBeTruthy()

            const secondPage = await ownerCtx.get(`/v1/project-roles/${viewerRole.id}/project-members`, { limit: '1', cursor: firstPage.json().next })
            expect(secondPage.statusCode).toBe(StatusCodes.OK)
            expect(secondPage.json().data).toHaveLength(1)

            const pagedUserIds = [...firstPage.json().data, ...secondPage.json().data].map((member: { userId: string }) => member.userId)
            expect(pagedUserIds.sort()).toEqual([firstMember.user.id, secondMember.user.id].sort())
        })
    })

    describe('Get Project Role By Id Edge Cases', () => {
        it('should return not found for an unknown id', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get(`/v1/project-roles/${apId()}`)

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should let a platform member read a custom role of their platform', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { projectRolesEnabled: true } })
            const memberCtx = await createMemberContext(app!, ownerCtx, { projectRole: DefaultProjectRole.VIEWER })
            const customRole = createMockProjectRole({ platformId: ownerCtx.platform.id, type: RoleType.CUSTOM, name: faker.string.alphanumeric(16) })
            await db.save('project_role', customRole)

            const response = await memberCtx.get(`/v1/project-roles/${customRole.id}`)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(customRole.id)
        })

        it('should not return a custom role of another platform to an api key', async () => {
            const ownerCtx = await createTestContext(app!)
            const otherCtx = await createTestContext(app!)
            const serviceCtx = await createServiceContext(app!, otherCtx)
            const foreignRole = createMockProjectRole({ platformId: ownerCtx.platform.id, type: RoleType.CUSTOM, name: faker.string.alphanumeric(16) })
            await db.save('project_role', foreignRole)

            const response = await serviceCtx.get(`/v1/project-roles/${foreignRole.id}`)

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should return a custom role of the caller platform to an api key', async () => {
            const ownerCtx = await createTestContext(app!)
            const serviceCtx = await createServiceContext(app!, ownerCtx)
            const customRole = createMockProjectRole({ platformId: ownerCtx.platform.id, type: RoleType.CUSTOM, name: faker.string.alphanumeric(16) })
            await db.save('project_role', customRole)

            const response = await serviceCtx.get(`/v1/project-roles/${customRole.id}`)

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().id).toBe(customRole.id)
        })
    })
})
