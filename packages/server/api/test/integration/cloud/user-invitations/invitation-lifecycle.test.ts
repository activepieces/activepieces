import { ErrorCode, ProjectRole } from '@activepieces/core-utils'
import { ApplicationEventName, DefaultProjectRole, InvitationStatus, InvitationType, PlatformRole, PrincipalType, UserInvitation } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as applicationEventsModule from '../../../../src/app/helper/application-events'
import { JwtAudience, jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
import { actionsEmitted } from '../../../helpers/application-events'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockUser, createMockUserIdentity, createMockUserInvitation, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger
const originalApplicationEvents = applicationEventsModule.applicationEvents

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
})

afterEach(() => {
    vi.restoreAllMocks()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Invitation record', () => {
    it('keeps the invitation as joined when the person is provisioned', async () => {
        const { mockPlatform } = await createEnvironment()
        const identity = createMockUserIdentity({ verified: true })
        await db.save('user_identity', identity)
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: identity.email, status: InvitationStatus.ACCEPTED })
        await userInvitationsService(mockLog).provisionUserInvitation({ email: identity.email })
        expect(await db.findOneByOrFail<UserInvitation>('user_invitation', { id: invitation.id })).toMatchObject({ status: InvitationStatus.JOINED })
        expect(await db.findOneBy('user', { identityId: identity.id, platformId: mockPlatform.id })).not.toBeNull()
    })

    it('never lists a joined invitation', async () => {
        const { mockPlatform, mockOwnerToken } = await createEnvironment()
        const pending = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.PENDING })
        await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.JOINED })
        const unfiltered = await listInvitations({ token: mockOwnerToken, query: { type: InvitationType.PLATFORM } })
        const askedForJoined = await listInvitations({ token: mockOwnerToken, query: { type: InvitationType.PLATFORM, status: InvitationStatus.JOINED } })
        expect(unfiltered.map((row) => row.id)).toEqual([pending.id])
        expect(askedForJoined).toEqual([])
    })

    it('answers an old link to a joined invitation as not found, so it cannot grant its role again', async () => {
        const { mockPlatform } = await createEnvironment()
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.JOINED })
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations/accept',
            body: { invitationToken: await signInvitationToken(invitation.id) },
        })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(response.json()).toMatchObject({ code: ErrorCode.ENTITY_NOT_FOUND })
        expect(await db.findOneByOrFail<UserInvitation>('user_invitation', { id: invitation.id })).toMatchObject({ status: InvitationStatus.JOINED })
    })

    it('answers deleting a joined invitation as not found', async () => {
        const { mockPlatform, mockOwnerToken } = await createEnvironment()
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.JOINED })
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/user-invitations/${invitation.id}`,
            headers: { authorization: `Bearer ${mockOwnerToken}` },
        })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(response.json()).toMatchObject({ code: ErrorCode.ENTITY_NOT_FOUND })
        expect(await db.findOneByOrFail<UserInvitation>('user_invitation', { id: invitation.id })).toMatchObject({ status: InvitationStatus.JOINED })
    })

    it('answers removing a project from a joined invitation as not found, and leaves it untouched', async () => {
        const { mockPlatform, mockProject, mockOwnerToken } = await createEnvironment()
        await db.update('platform', mockPlatform.id, { autoCreatePersonalProjects: false })
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.JOINED, projectId: mockProject.id })
        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/user-invitations/${invitation.id}/remove-project`,
            headers: { authorization: `Bearer ${mockOwnerToken}` },
            body: { projectId: mockProject.id },
        })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(response.json()).toMatchObject({ code: ErrorCode.ENTITY_NOT_FOUND })
        expect(await db.findOneByOrFail<UserInvitation>('user_invitation', { id: invitation.id })).toMatchObject({ status: InvitationStatus.JOINED, projectId: mockProject.id })
    })

    it('adds an existing member to a project at once, and keeps that invitation joined and unlisted', async () => {
        const { mockPlatform, mockProject, mockOwnerToken } = await createEnvironment()
        const identity = createMockUserIdentity({ verified: true })
        await db.save('user_identity', identity)
        const member = createMockUser({ identityId: identity.id, platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER })
        await db.save('user', member)
        const editorRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.EDITOR })
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${mockOwnerToken}` },
            body: { email: identity.email, type: InvitationType.PROJECT, projectId: mockProject.id, projectRole: editorRole.name },
        })
        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(await db.findOneBy('project_member', { userId: member.id, projectId: mockProject.id })).not.toBeNull()
        expect(await db.findOneByOrFail<UserInvitation>('user_invitation', { id: response.json().id })).toMatchObject({ status: InvitationStatus.JOINED })
        expect(await listInvitations({ token: mockOwnerToken, query: { type: InvitationType.PROJECT } })).toEqual([])
    })

    it('invites someone who left the platform again as a new pending invitation on the same row', async () => {
        const { mockPlatform, mockOwnerToken } = await createEnvironment()
        const email = faker.internet.email().toLowerCase()
        const joined = await saveInvitation({ platformId: mockPlatform.id, email, status: InvitationStatus.JOINED })
        const reinvited = await inviteThroughApi({ token: mockOwnerToken, email })
        expect(reinvited.id).toBe(joined.id)
        expect(await db.findOneByOrFail<UserInvitation>('user_invitation', { id: joined.id })).toMatchObject({ status: InvitationStatus.PENDING })
        const listed = await listInvitations({ token: mockOwnerToken, query: { type: InvitationType.PLATFORM } })
        expect(listed.map((row) => row.id)).toEqual([joined.id])
    })

    it('reserves no seat for a joined invitation', async () => {
        const { mockPlatform } = await createEnvironment()
        await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.JOINED })
        await expect(userInvitationsService(mockLog).countReservedSeats({ platformId: mockPlatform.id })).resolves.toBe(0)
    })
})

describe('Invitation audit events', () => {
    it('logs an invitation being sent, accepted and deleted, and the delete removes the row', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockOwnerToken } = await createEnvironment()
        const sent = await inviteThroughApi({ token: mockOwnerToken, email: faker.internet.email() })
        const accepted = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations/accept',
            body: { invitationToken: await signInvitationToken(sent.id) },
        })
        expect(accepted.statusCode).toBe(StatusCodes.OK)
        const deleted = await app.inject({
            method: 'DELETE',
            url: `/api/v1/user-invitations/${sent.id}`,
            headers: { authorization: `Bearer ${mockOwnerToken}` },
        })
        expect(deleted.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await db.findOneBy('user_invitation', { id: sent.id })).toBeNull()
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.USER_INVITATION_SENT,
            ApplicationEventName.USER_INVITATION_ACCEPTED,
            ApplicationEventName.USER_INVITATION_DELETED,
        ])
    })

    it('logs a delete when removing its only project deletes the invitation', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockPlatform, mockProject, mockOwnerToken } = await createEnvironment()
        await db.update('platform', mockPlatform.id, { autoCreatePersonalProjects: false })
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.PENDING, projectId: mockProject.id })
        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/user-invitations/${invitation.id}/remove-project`,
            headers: { authorization: `Bearer ${mockOwnerToken}` },
            body: { projectId: mockProject.id },
        })
        expect(response.json()).toStrictEqual({ revoked: true, invitation: null })
        expect(await db.findOneBy('user_invitation', { id: invitation.id })).toBeNull()
        expect(actionsEmitted(sendUserEventSpy)).toEqual([ApplicationEventName.USER_INVITATION_DELETED])
    })

    it('logs one accepted event when the same link is accepted twice', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockPlatform } = await createEnvironment()
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.PENDING })
        const invitationToken = await signInvitationToken(invitation.id)
        const first = await app.inject({ method: 'POST', url: '/api/v1/user-invitations/accept', body: { invitationToken } })
        const second = await app.inject({ method: 'POST', url: '/api/v1/user-invitations/accept', body: { invitationToken } })
        expect([first.statusCode, second.statusCode]).toEqual([StatusCodes.OK, StatusCodes.OK])
        expect(actionsEmitted(sendUserEventSpy)).toEqual([ApplicationEventName.USER_INVITATION_ACCEPTED])
    })

    it('counts one first acceptance when the same invitation is accepted twice at the same moment', async () => {
        const { mockPlatform } = await createEnvironment()
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.PENDING })
        const results = await Promise.all([
            userInvitationsService(mockLog).accept({ invitationId: invitation.id, platformId: mockPlatform.id }),
            userInvitationsService(mockLog).accept({ invitationId: invitation.id, platformId: mockPlatform.id }),
        ])
        expect(results.map((result) => result.firstAcceptance).sort()).toEqual([false, true])
    })

    it('keeps the invitation link out of the audit event', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockOwnerToken } = await createEnvironment()
        const sent = await inviteThroughApi({ token: mockOwnerToken, email: faker.internet.email() })
        expect(sent).toHaveProperty('link')
        expect(sendUserEventSpy.mock.calls[0][1].data).toStrictEqual({
            invitation: {
                id: sent.id,
                email: sent.email,
                type: InvitationType.PLATFORM,
                platformRole: PlatformRole.MEMBER,
                projectId: null,
            },
        })
    })
})

async function createEnvironment(): Promise<Environment> {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled: true, auditLogEnabled: false },
    })
    const mockOwnerToken = await generateMockToken({
        id: mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: mockPlatform.id },
    })
    return { mockPlatform, mockProject, mockOwnerToken }
}

function spyOnSendUserEvent(): ReturnType<typeof vi.fn> {
    const sendUserEventSpy = vi.fn()
    vi.spyOn(applicationEventsModule, 'applicationEvents').mockImplementation((log) => ({
        ...originalApplicationEvents(log),
        sendUserEvent: sendUserEventSpy,
    }))
    return sendUserEventSpy
}

async function inviteThroughApi({ token, email }: InviteThroughApiParams): Promise<UserInvitation> {
    const response = await app.inject({
        method: 'POST',
        url: '/api/v1/user-invitations',
        headers: { authorization: `Bearer ${token}` },
        body: { email, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function listInvitations({ token, query }: ListInvitationsParams): Promise<UserInvitation[]> {
    const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user-invitations',
        headers: { authorization: `Bearer ${token}` },
        query,
    })
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json().data
}

async function saveInvitation({ platformId, email, status, projectId = null }: SaveInvitationParams): Promise<UserInvitation> {
    const invitation = createMockUserInvitation({ platformId, email, status, projectId, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER })
    await db.save('user_invitation', invitation)
    return invitation
}

async function signInvitationToken(invitationId: string): Promise<string> {
    const key = await jwtUtils.getJwtSecret()
    return jwtUtils.sign({
        payload: { id: invitationId },
        key,
        audience: JwtAudience.USER_INVITATION,
    })
}

type Environment = Pick<Awaited<ReturnType<typeof mockAndSaveBasicSetup>>, 'mockPlatform' | 'mockProject'> & {
    mockOwnerToken: string
}

type InviteThroughApiParams = {
    token: string
    email: string
}

type ListInvitationsParams = {
    token: string
    query: Record<string, string>
}

type SaveInvitationParams = {
    platformId: string
    email: string
    status: InvitationStatus
    projectId?: string | null
}
