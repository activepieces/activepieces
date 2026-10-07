import { apId, ErrorCode, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, InvitationStatus, InvitationType, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { platformService } from '../../../../src/app/platform/platform.service'
import { userService } from '../../../../src/app/user/user-service'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProject, createMockProjectMember, createMockProjectRole, createMockUserIdentity, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('A platform invite can name a project', () => {
    it('stores the project and adds the member to it with the picked role on accept', async () => {
        const { mockPlatform, mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const email = faker.internet.email().toLowerCase()

        const response = await invite({ token: ownerToken, email, projectId: mockProject.id, projectRole: DefaultProjectRole.VIEWER })

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        const invitation = await databaseConnection().getRepository('user_invitation').findOneByOrFail({ id: response?.json().id })
        expect(invitation.projectId).toBe(mockProject.id)
        expect(invitation.type).toBe(InvitationType.PLATFORM)

        const user = await acceptAndProvision({ invitationId: invitation.id, email, platformId: mockPlatform.id })

        expect(user.platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.VIEWER })
    })

    it('keeps the picked role when the project is also a default project', async () => {
        const { mockPlatform, mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { defaultProjectIds: [mockProject.id] })
        const email = faker.internet.email().toLowerCase()

        const response = await invite({ token: ownerToken, email, projectId: mockProject.id, projectRole: DefaultProjectRole.VIEWER })
        const user = await acceptAndProvision({ invitationId: response?.json().id, email, platformId: mockPlatform.id })

        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.VIEWER })
    })

    it('still accepts a platform invite without a project', async () => {
        const { ownerToken } = await setupPlatform({ projectRolesEnabled: true })

        const response = await invite({ token: ownerToken, email: faker.internet.email() })

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        const invitation = await databaseConnection().getRepository('user_invitation').findOneByOrFail({ id: response?.json().id })
        expect(invitation.projectId).toBeNull()
    })

    it('refuses a personal project', async () => {
        const { mockPlatform, mockOwner, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const personalProject = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.PERSONAL })
        await databaseConnection().getRepository('project').save(personalProject)

        const response = await invite({ token: ownerToken, email: faker.internet.email(), projectId: personalProject.id, projectRole: DefaultProjectRole.EDITOR })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('refuses a project of another platform', async () => {
        const { ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const { mockProject: otherProject } = await setupPlatform({ projectRolesEnabled: true })

        const response = await invite({ token: ownerToken, email: faker.internet.email(), projectId: otherProject.id, projectRole: DefaultProjectRole.EDITOR })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('refuses a project without a role', async () => {
        const { mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })

        const response = await invite({ token: ownerToken, email: faker.internet.email(), projectId: mockProject.id })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('refuses a project on a plan without project roles', async () => {
        const { mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: false })

        const response = await invite({ token: ownerToken, email: faker.internet.email(), projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR })

        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(response?.json().code).toBe(ErrorCode.FEATURE_DISABLED)
    })

    it('still creates the user when the plan lost project roles before they accepted', async () => {
        const { mockPlatform, mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const email = faker.internet.email().toLowerCase()
        const response = await invite({ token: ownerToken, email, projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR })
        await databaseConnection().getRepository('platform_plan').update({ platformId: mockPlatform.id }, { projectRolesEnabled: false })

        const user = await acceptAndProvision({ invitationId: response?.json().id, email, platformId: mockPlatform.id })

        expect(user.platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({})
    })
})

describe('A platform invite outlives its project', () => {
    it('skips a project that was deleted before they accepted, instead of failing the sign-up', async () => {
        const { mockPlatform, mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const email = faker.internet.email().toLowerCase()
        const response = await invite({ token: ownerToken, email, projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR })
        await databaseConnection().getRepository('project').softDelete({ id: mockProject.id })

        const user = await acceptAndProvision({ invitationId: response?.json().id, email, platformId: mockPlatform.id })

        expect(user.platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({})
    })

    it('keeps the platform invite, without the project, when the project is hard-deleted', async () => {
        const { mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const response = await invite({ token: ownerToken, email: faker.internet.email(), projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR })

        await databaseConnection().transaction(async (entityManager) => {
            await userInvitationsService(mockLog).detachProjectFromPlatformInvites({ projectId: mockProject.id, entityManager })
            await entityManager.getRepository('project').delete({ id: mockProject.id })
        })

        const invitation = await databaseConnection().getRepository('user_invitation').findOneByOrFail({ id: response?.json().id })
        expect(invitation.projectId).toBeNull()
        expect(invitation.projectRoleId).toBeNull()
    })

    it('keeps the platform invite, without the project, when its custom role is deleted', async () => {
        const { mockPlatform, mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const role = createMockProjectRole({ platformId: mockPlatform.id, type: RoleType.CUSTOM, name: `Custom ${apId()}` })
        await databaseConnection().getRepository('project_role').save(role)
        const response = await invite({ token: ownerToken, email: faker.internet.email(), projectId: mockProject.id, projectRole: role.name })

        const deletion = await app?.inject({ method: 'DELETE', url: `/api/v1/project-roles/${encodeURIComponent(role.name)}`, headers: { authorization: `Bearer ${ownerToken}` } })

        expect(deletion?.statusCode).toBe(StatusCodes.OK)
        const invitation = await databaseConnection().getRepository('user_invitation').findOneByOrFail({ id: response?.json().id })
        expect(invitation.projectId).toBeNull()
        expect(invitation.projectRoleId).toBeNull()
    })
})

describe('Platform users list says who has a project', () => {
    it('marks members with and without a project', async () => {
        const { mockPlatform, mockProject, ownerToken } = await setupPlatform({ projectRolesEnabled: true })
        const { mockUser: withProject } = await mockBasicUser({ user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER } })
        const { mockUser: withoutProject } = await mockBasicUser({ user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER } })
        const editorRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.EDITOR })
        await databaseConnection().getRepository('project_member').save(createMockProjectMember({
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            userId: withProject.id,
            projectRoleId: editorRole.id,
        }))

        const response = await app?.inject({
            method: 'GET',
            url: '/api/v1/users',
            headers: { authorization: `Bearer ${ownerToken}` },
            query: { limit: '100' },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const hasProjectsById = Object.fromEntries(response?.json().data.map((user: { id: string, hasProjects: boolean }) => [user.id, user.hasProjects]))
        expect(hasProjectsById[withProject.id]).toBe(true)
        expect(hasProjectsById[withoutProject.id]).toBe(false)
    })
})

describe('A platform where someone has no project is still theirs', () => {
    it('names it in the platform switcher list', async () => {
        const { mockPlatform } = await setupPlatform({ projectRolesEnabled: true })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { autoCreatePersonalProjects: false })
        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)
        const { user } = await userService(mockLog).getOrCreateWithProject({ identity, platformId: mockPlatform.id })
        const token = await generateMockToken({ id: user.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

        const response = await app?.inject({ method: 'GET', url: '/api/v1/platforms', headers: { authorization: `Bearer ${token}` } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json()).toStrictEqual([{ platformId: mockPlatform.id, platformName: mockPlatform.name, projects: [] }])
    })


    it('lists it after the platforms where they have a project', async () => {
        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)
        const { mockPlatform: emptyPlatform } = await setupPlatform({ projectRolesEnabled: true })
        const { mockPlatform: busyPlatform } = await setupPlatform({ projectRolesEnabled: true })
        await databaseConnection().getRepository('platform').update({ id: emptyPlatform.id }, { autoCreatePersonalProjects: false })
        await userService(mockLog).getOrCreateWithProject({ identity, platformId: emptyPlatform.id })
        await userService(mockLog).getOrCreateWithProject({ identity, platformId: busyPlatform.id })

        const platforms = await platformService(mockLog).listPlatformsForIdentity({ identityId: identity.id })

        expect(platforms.map((platform) => platform.id)).toStrictEqual([busyPlatform.id, emptyPlatform.id])
    })
})

async function setupPlatform({ projectRolesEnabled }: { projectRolesEnabled: boolean }) {
    const setup = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled },
        project: { type: ProjectType.TEAM },
    })
    const ownerToken = await generateMockToken({
        id: setup.mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: setup.mockPlatform.id },
    })
    return { ...setup, ownerToken }
}

async function invite({ token, email, projectId, projectRole }: { token: string, email: string, projectId?: string, projectRole?: string }) {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/user-invitations',
        headers: { authorization: `Bearer ${token}` },
        body: {
            email,
            type: InvitationType.PLATFORM,
            platformRole: PlatformRole.MEMBER,
            projectId,
            projectRole,
        },
    })
}

async function acceptAndProvision({ invitationId, email, platformId }: { invitationId: string, email: string, platformId: string }) {
    const identity = createMockUserIdentity({ verified: true, email })
    await databaseConnection().getRepository('user_identity').save(identity)
    await databaseConnection().getRepository('user_invitation').update({ id: invitationId }, { status: InvitationStatus.ACCEPTED })
    await userInvitationsService(mockLog).provisionUserInvitation({ email })
    return databaseConnection().getRepository('user').findOneByOrFail({ identityId: identity.id, platformId })
}

async function roleNamesByProject({ userId }: { userId: string }): Promise<Record<string, string>> {
    const rows: { projectId: string, name: string }[] = await databaseConnection().query(
        'SELECT pm."projectId", pr."name" FROM "project_member" pm JOIN "project_role" pr ON pr."id" = pm."projectRoleId" WHERE pm."userId" = $1',
        [userId],
    )
    return Object.fromEntries(rows.map((row) => [row.projectId, row.name]))
}
