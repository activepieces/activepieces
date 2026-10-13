import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole, InvitationStatus, InvitationType, PlatformRole, ProjectType, SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { userEnterpriseHooks } from '../../../../src/app/ee/users/ee-user-hooks'
import { userHooks } from '../../../../src/app/user/user-hooks'
import { userService } from '../../../../src/app/user/user-service'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
import { createMockApiKey, createMockProject, createMockUserIdentity, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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

describe('New members join default projects', () => {
    it('adds a new member to every default project as Editor, alongside their personal project', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const secondProject = await saveTeamProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id, secondProject.id] })

        const { user } = await provisionNewUser({ platformId: mockPlatform.id })

        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({
            [mockProject.id]: DefaultProjectRole.EDITOR,
            [secondProject.id]: DefaultProjectRole.EDITOR,
        })
        expect(await personalProjectCount({ userId: user.id })).toBe(1)
    })

    it('adds a new member to the default projects only when personal projects are off', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const { user } = await provisionNewUser({ platformId: mockPlatform.id })

        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
        expect(await personalProjectCount({ userId: user.id })).toBe(0)
    })

    it('skips a default project that was deleted', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const deletedProject = await saveTeamProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id, deletedProject.id] })
        await databaseConnection().getRepository('project').softDelete({ id: deletedProject.id })

        const { user } = await provisionNewUser({ platformId: mockPlatform.id })

        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
    })

    it('adds a user created by SCIM to the default projects', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true }, project: { type: ProjectType.TEAM } })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })

        const response = await createScimUser({ platformId: mockPlatform.id, email: `${apId()}@example.com` })

        expect(await roleNamesByProject({ userId: response?.json().id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
    })

    it('gives a SCIM user without a role the role of their accepted Admin invite, and no default projects', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true }, project: { type: ProjectType.TEAM } })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const email = `${apId()}@example.com`
        await savePlatformInvite({ email, platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN })

        const response = await createScimUser({ platformId: mockPlatform.id, email })

        const user = await databaseConnection().getRepository('user').findOneByOrFail({ id: response?.json().id })
        expect(user.platformRole).toBe(PlatformRole.ADMIN)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({})
    })

    it('gives a SCIM user without a role the role of their latest accepted invite, not an older Admin one', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true }, project: { type: ProjectType.TEAM } })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const email = `${apId()}@example.com`
        await savePlatformInvite({ email, platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN, updated: '2026-01-01T00:00:00.000Z' })
        await savePlatformInvite({ email, platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER, updated: '2026-02-01T00:00:00.000Z' })

        const response = await createScimUser({ platformId: mockPlatform.id, email })

        const user = await databaseConnection().getRepository('user').findOneByOrFail({ id: response?.json().id })
        expect(user.platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
    })

    it('uses up the accepted invite once SCIM takes its role, so re-creating them later without a role makes a Member', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true }, project: { type: ProjectType.TEAM } })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const email = `${apId()}@example.com`
        await savePlatformInvite({ email, platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN })

        const first = await createScimUser({ platformId: mockPlatform.id, email })
        expect(await databaseConnection().getRepository('user_invitation').countBy({ email, platformId: mockPlatform.id })).toBe(0)
        await databaseConnection().getRepository('user').update({ id: first?.json().id }, { platformId: null })
        const second = await createScimUser({ platformId: mockPlatform.id, email })

        const recreated = await databaseConnection().getRepository('user').findOneByOrFail({ id: second?.json().id })
        expect(recreated.platformRole).toBe(PlatformRole.MEMBER)
    })

    it('keeps the role SCIM sends over an accepted Admin invite, and adds a Member to the default projects', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true }, project: { type: ProjectType.TEAM } })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const email = `${apId()}@example.com`
        await savePlatformInvite({ email, platformId: mockPlatform.id, platformRole: PlatformRole.ADMIN })

        const response = await createScimUser({ platformId: mockPlatform.id, email, platformRole: PlatformRole.MEMBER })

        const user = await databaseConnection().getRepository('user').findOneByOrFail({ id: response?.json().id })
        expect(user.platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
        expect(await databaseConnection().getRepository('user_invitation').countBy({ email, platformId: mockPlatform.id })).toBe(1)
    })

    it('does not add a SCIM user created as Admin to the default projects', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true }, project: { type: ProjectType.TEAM } })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })

        const response = await createScimUser({ platformId: mockPlatform.id, email: `${apId()}@example.com`, platformRole: PlatformRole.ADMIN })

        expect(await roleNamesByProject({ userId: response?.json().id })).toStrictEqual({})
    })

    it('joins nothing on a plan without project roles', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: false })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })

        const { user } = await provisionNewUser({ platformId: mockPlatform.id })

        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({})
    })

    it('does not add a returning member to the default projects', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const identity = await saveIdentity()
        const { user } = await userService(mockLog).getOrCreateWithProject({ identity, platformId: mockPlatform.id })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })

        const second = await userService(mockLog).getOrCreateWithProject({ identity, platformId: mockPlatform.id })

        expect(second.created).toBe(false)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({})
    })

    it('keeps the role from a project invitation to a default project', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const identity = await saveIdentity()
        const viewerRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.VIEWER })
        await databaseConnection().getRepository('user_invitation').save({
            id: apId(),
            email: identity.email,
            type: InvitationType.PROJECT,
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            projectRoleId: viewerRole.id,
            status: InvitationStatus.ACCEPTED,
        })

        await userInvitationsService(mockLog).provisionUserInvitation({ email: identity.email })

        const user = await databaseConnection().getRepository('user').findOneByOrFail({ identityId: identity.id, platformId: mockPlatform.id })
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.VIEWER })
    })

    it.each([PlatformRole.ADMIN, PlatformRole.OPERATOR])('does not add someone invited as %s to the default projects', async (platformRole) => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const identity = await saveIdentity()
        await savePlatformInvite({ email: identity.email, platformId: mockPlatform.id, platformRole })

        await userInvitationsService(mockLog).provisionUserInvitation({ email: identity.email })

        const user = await databaseConnection().getRepository('user').findOneByOrFail({ identityId: identity.id, platformId: mockPlatform.id })
        expect(user.platformRole).toBe(platformRole)
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({})
    })

    it('adds someone invited to the platform as Member to the default projects', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const identity = await saveIdentity()
        await savePlatformInvite({ email: identity.email, platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })

        await userInvitationsService(mockLog).provisionUserInvitation({ email: identity.email })

        const user = await databaseConnection().getRepository('user').findOneByOrFail({ identityId: identity.id, platformId: mockPlatform.id })
        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
    })

    it('never joins a personal project or another platform\'s project, even when saved as a default', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const { mockProject: otherPlatformProject } = await setupPlatform({ projectRolesEnabled: true })
        const personalProject = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.PERSONAL })
        await databaseConnection().getRepository('project').save(personalProject)
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id, personalProject.id, otherPlatformProject.id] })

        const { user } = await provisionNewUser({ platformId: mockPlatform.id })

        expect(await roleNamesByProject({ userId: user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
    })

    it('saves nothing when joining the default projects fails', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setDefaults({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id] })
        const identity = await saveIdentity()
        userHooks.set(() => ({
            postCreate: async () => {
                throw new Error('join failed')
            },
        }))

        try {
            await expect(userService(mockLog).getOrCreateWithProject({ identity, platformId: mockPlatform.id })).rejects.toThrow('join failed')
        }
        finally {
            userHooks.set(userEnterpriseHooks)
        }

        expect(await databaseConnection().getRepository('user').countBy({ identityId: identity.id, platformId: mockPlatform.id })).toBe(0)
        expect(await databaseConnection().getRepository('project').countBy({ platformId: mockPlatform.id, type: ProjectType.PERSONAL })).toBe(0)

        const retry = await userService(mockLog).getOrCreateWithProject({ identity, platformId: mockPlatform.id })
        expect(retry.created).toBe(true)
        expect(await roleNamesByProject({ userId: retry.user.id })).toStrictEqual({ [mockProject.id]: DefaultProjectRole.EDITOR })
    })
})

async function setupPlatform({ projectRolesEnabled }: { projectRolesEnabled: boolean }) {
    return mockAndSaveBasicSetup({
        plan: { projectRolesEnabled },
        project: { type: ProjectType.TEAM },
    })
}

async function saveTeamProject({ platformId, ownerId }: { platformId: string, ownerId: string }) {
    const project = createMockProject({ platformId, ownerId, type: ProjectType.TEAM })
    await databaseConnection().getRepository('project').save(project)
    return project
}

async function setDefaults({ platformId, defaultProjectIds, autoCreatePersonalProjects = true }: { platformId: string, defaultProjectIds: string[], autoCreatePersonalProjects?: boolean }) {
    await databaseConnection().getRepository('platform').update({ id: platformId }, { defaultProjectIds, autoCreatePersonalProjects })
}

async function saveIdentity() {
    const identity = createMockUserIdentity({ verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    return identity
}

async function savePlatformInvite({ email, platformId, platformRole, updated }: { email: string, platformId: string, platformRole: PlatformRole, updated?: string }) {
    const id = apId()
    await databaseConnection().getRepository('user_invitation').save({
        id,
        email,
        type: InvitationType.PLATFORM,
        platformId,
        platformRole,
        status: InvitationStatus.ACCEPTED,
    })
    if (updated) {
        await databaseConnection().getRepository('user_invitation').update({ id }, { updated })
    }
}

async function createScimUser({ platformId, email, platformRole }: { platformId: string, email: string, platformRole?: PlatformRole }) {
    const apiKey = createMockApiKey({ platformId })
    await databaseConnection().getRepository('api_key').save(apiKey)
    return app?.inject({
        method: 'POST',
        url: '/api/v1/scim/v2/Users',
        headers: { authorization: `Bearer ${apiKey.value}` },
        body: {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
            externalId: apId(),
            userName: email,
            name: { givenName: 'Scim', familyName: 'User' },
            emails: [{ value: email, primary: true }],
            active: true,
            ...(platformRole ? { [SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]: { platformRole } } : {}),
        },
    })
}

async function provisionNewUser({ platformId }: { platformId: string }) {
    const identity = await saveIdentity()
    return userService(mockLog).getOrCreateWithProject({ identity, platformId })
}

async function roleNamesByProject({ userId }: { userId: string }): Promise<Record<string, string>> {
    const rows: { projectId: string, name: string }[] = await databaseConnection().query(
        'SELECT pm."projectId", pr."name" FROM "project_member" pm JOIN "project_role" pr ON pr."id" = pm."projectRoleId" WHERE pm."userId" = $1',
        [userId],
    )
    return Object.fromEntries(rows.map((row) => [row.projectId, row.name]))
}

async function personalProjectCount({ userId }: { userId: string }): Promise<number> {
    return databaseConnection().getRepository('project').countBy({ ownerId: userId, type: ProjectType.PERSONAL })
}
