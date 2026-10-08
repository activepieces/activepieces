import { ErrorCode } from '@activepieces/core-utils'
import { DefaultProjectRole, InvitationStatus, InvitationType, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProject, createMockUserInvitation, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Inviting the same email to the platform again', () => {
    it('updates the pending invite instead of adding a second one', async () => {
        const { platformId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        const first = await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.OPERATOR })
        const second = await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.ADMIN })

        expect(second?.statusCode).toBe(StatusCodes.CREATED)
        expect(second?.json().id).toBe(first?.json().id)
        const invitations = await platformInvitesOf({ email, platformId })
        expect(invitations).toHaveLength(1)
        expect(invitations[0].platformRole).toBe(PlatformRole.ADMIN)
    })

    it('matches the email regardless of case', async () => {
        const { platformId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.OPERATOR })
        await invitePlatform({ token: ownerToken, email: email.toUpperCase(), platformRole: PlatformRole.OPERATOR })

        expect(await platformInvitesOf({ email, platformId })).toHaveLength(1)
    })

    it('replaces the project and role on the existing invite', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const otherProject = createMockProject({ platformId, ownerId: (await ownerOf({ platformId })), type: ProjectType.TEAM })
        await databaseConnection().getRepository('project').save(otherProject)
        const email = faker.internet.email().toLowerCase()

        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId: otherProject.id, projectRole: DefaultProjectRole.VIEWER })

        const invitations = await platformInvitesOf({ email, platformId })
        expect(invitations).toHaveLength(1)
        expect(invitations[0].projectId).toBe(otherProject.id)
        expect(await roleNameOf({ projectRoleId: invitations[0].projectRoleId })).toBe(DefaultProjectRole.VIEWER)
    })

    it('drops the project when the new invite has none', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.OPERATOR })

        const invitations = await platformInvitesOf({ email, platformId })
        expect(invitations).toHaveLength(1)
        expect(invitations[0].projectId).toBeNull()
        expect(invitations[0].projectRoleId).toBeNull()
    })

    it('collapses duplicates left from before into one invite', async () => {
        const { platformId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()
        await databaseConnection().getRepository('user_invitation').save([
            createMockUserInvitation({ email, platformId, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER, status: InvitationStatus.PENDING, created: '2026-01-01T00:00:00.000Z' }),
            createMockUserInvitation({ email, platformId, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER, status: InvitationStatus.PENDING, created: '2026-02-01T00:00:00.000Z' }),
        ])

        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.ADMIN })

        const invitations = await platformInvitesOf({ email, platformId })
        expect(invitations).toHaveLength(1)
        expect(invitations[0].platformRole).toBe(PlatformRole.ADMIN)
    })

    it('creates one invite when two arrive at the same time', async () => {
        const { platformId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        const responses = await Promise.all([
            invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.OPERATOR }),
            invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.OPERATOR }),
        ])

        expect(responses.map((response) => response?.statusCode)).toStrictEqual([StatusCodes.CREATED, StatusCodes.CREATED])
        expect(await platformInvitesOf({ email, platformId })).toHaveLength(1)
    })

    it('keeps one invite per platform for the same email', async () => {
        const first = await setupPlatform()
        const second = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        await invitePlatform({ token: first.ownerToken, email, platformRole: PlatformRole.OPERATOR })
        await invitePlatform({ token: second.ownerToken, email, platformRole: PlatformRole.OPERATOR })

        expect(await platformInvitesOf({ email, platformId: first.platformId })).toHaveLength(1)
        expect(await platformInvitesOf({ email, platformId: second.platformId })).toHaveLength(1)
    })
})

describe('A platform invite and a project invite for the same project', () => {
    it('a platform invite naming the project replaces the pending project invite', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        await inviteProject({ token: ownerToken, email, projectId, projectRole: DefaultProjectRole.VIEWER })
        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })

        const invitations = await invitesOf({ email, platformId })
        expect(invitations).toHaveLength(1)
        expect(invitations[0].type).toBe(InvitationType.PLATFORM)
        expect(invitations[0].projectId).toBe(projectId)
    })

    it('a project invite takes the project off the platform invite, and both stay', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()

        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        await inviteProject({ token: ownerToken, email, projectId, projectRole: DefaultProjectRole.VIEWER })

        const invitations = await invitesOf({ email, platformId })
        const platformInvite = invitations.find((invitation) => invitation.type === InvitationType.PLATFORM)
        const projectInvite = invitations.find((invitation) => invitation.type === InvitationType.PROJECT)
        expect(invitations).toHaveLength(2)
        expect(platformInvite?.platformRole).toBe(PlatformRole.MEMBER)
        expect(platformInvite?.projectId).toBeNull()
        expect(projectInvite?.projectId).toBe(projectId)
    })
})

describe('Removing a platform invite from a project', () => {
    it('takes the project off the invite and keeps the invite', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()
        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        const [invitation] = await platformInvitesOf({ email, platformId })

        const response = await removeProject({ token: ownerToken, invitationId: invitation.id })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const [after] = await platformInvitesOf({ email, platformId })
        expect(after.id).toBe(invitation.id)
        expect(after.platformRole).toBe(PlatformRole.MEMBER)
        expect(after.projectId).toBeNull()
        expect(after.projectRoleId).toBeNull()
    })

    it('is refused to a member who is not a platform admin', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()
        await invitePlatform({ token: ownerToken, email, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        const [invitation] = await platformInvitesOf({ email, platformId })
        const { mockUser } = await mockBasicUser({ user: { platformId, platformRole: PlatformRole.MEMBER } })
        const memberToken = await generateMockToken({ id: mockUser.id, type: PrincipalType.USER, platform: { id: platformId } })

        const response = await removeProject({ token: memberToken, invitationId: invitation.id })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        const [after] = await platformInvitesOf({ email, platformId })
        expect(after.projectId).toBe(projectId)
    })

    it('refuses a project invite', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const email = faker.internet.email().toLowerCase()
        await inviteProject({ token: ownerToken, email, projectId, projectRole: DefaultProjectRole.VIEWER })
        const [invitation] = await invitesOf({ email, platformId })

        const response = await removeProject({ token: ownerToken, invitationId: invitation.id })

        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('does not find another platform\'s invite', async () => {
        const first = await setupPlatform()
        const second = await setupPlatform()
        const email = faker.internet.email().toLowerCase()
        await invitePlatform({ token: second.ownerToken, email, platformRole: PlatformRole.MEMBER, projectId: second.projectId, projectRole: DefaultProjectRole.EDITOR })
        const [invitation] = await platformInvitesOf({ email, platformId: second.platformId })

        const response = await removeProject({ token: first.ownerToken, invitationId: invitation.id })

        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        const [after] = await platformInvitesOf({ email, platformId: second.platformId })
        expect(after.projectId).toBe(second.projectId)
    })
})

describe('Listing the platform invites that name a project', () => {
    it('returns only the platform invites for that project', async () => {
        const { platformId, projectId, ownerToken } = await setupPlatform()
        const named = faker.internet.email().toLowerCase()
        const unnamed = faker.internet.email().toLowerCase()
        await invitePlatform({ token: ownerToken, email: named, platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        await invitePlatform({ token: ownerToken, email: unnamed, platformRole: PlatformRole.OPERATOR })

        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/user-invitations?type=${InvitationType.PLATFORM}&projectId=${projectId}`,
            headers: { authorization: `Bearer ${ownerToken}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const emails = response?.json().data.map((invitation: { email: string }) => invitation.email)
        expect(emails).toStrictEqual([named])
        expect(await platformInvitesOf({ email: unnamed, platformId })).toHaveLength(1)
    })

    it('treats an empty project filter as no filter, as the web client sends it', async () => {
        const { ownerToken } = await setupPlatform()
        await invitePlatform({ token: ownerToken, email: faker.internet.email().toLowerCase(), platformRole: PlatformRole.OPERATOR })

        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/user-invitations?type=${InvitationType.PLATFORM}&projectId=`,
            headers: { authorization: `Bearer ${ownerToken}` },
        })

        expect(response?.json().data).toHaveLength(1)
    })

    it('still returns every platform invite without a project filter', async () => {
        const { projectId, ownerToken } = await setupPlatform()
        await invitePlatform({ token: ownerToken, email: faker.internet.email().toLowerCase(), platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR })
        await invitePlatform({ token: ownerToken, email: faker.internet.email().toLowerCase(), platformRole: PlatformRole.OPERATOR })

        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/user-invitations?type=${InvitationType.PLATFORM}`,
            headers: { authorization: `Bearer ${ownerToken}` },
        })

        expect(response?.json().data).toHaveLength(2)
    })
})

async function setupPlatform() {
    const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled: true },
        project: { type: ProjectType.TEAM },
    })
    const ownerToken = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
    return { platformId: mockPlatform.id, projectId: mockProject.id, ownerToken }
}

async function invitePlatform({ token, email, platformRole, projectId, projectRole }: { token: string, email: string, platformRole: PlatformRole, projectId?: string, projectRole?: string }) {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/user-invitations',
        headers: { authorization: `Bearer ${token}` },
        body: { email, type: InvitationType.PLATFORM, platformRole, projectId, projectRole },
    })
}

async function inviteProject({ token, email, projectId, projectRole }: { token: string, email: string, projectId: string, projectRole: string }) {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/user-invitations',
        headers: { authorization: `Bearer ${token}` },
        body: { email, type: InvitationType.PROJECT, projectId, projectRole },
    })
}

async function invitesOf({ email, platformId }: { email: string, platformId: string }) {
    return databaseConnection().getRepository('user_invitation').findBy({ email, platformId })
}

async function platformInvitesOf({ email, platformId }: { email: string, platformId: string }) {
    return databaseConnection().getRepository('user_invitation').findBy({ email, platformId, type: InvitationType.PLATFORM })
}

async function roleNameOf({ projectRoleId }: { projectRoleId: string }) {
    const role = await databaseConnection().getRepository('project_role').findOneByOrFail({ id: projectRoleId })
    return role.name
}

async function ownerOf({ platformId }: { platformId: string }) {
    const platform = await databaseConnection().getRepository('platform').findOneByOrFail({ id: platformId })
    return platform.ownerId
}

async function removeProject({ token, invitationId }: { token: string, invitationId: string }) {
    return app?.inject({
        method: 'POST',
        url: `/api/v1/user-invitations/${invitationId}/remove-project`,
        headers: { authorization: `Bearer ${token}` },
    })
}
