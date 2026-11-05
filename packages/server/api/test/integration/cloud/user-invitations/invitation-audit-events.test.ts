import { ProjectRole, RoleType } from '@activepieces/core-utils'
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
import { createMockProjectRole, createMockUserInvitation, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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
            projectRole: null,
        })
    })

    it('records the project role of a project invitation', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockProject, mockOwnerToken } = await createEnvironment()
        const editorRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.EDITOR })
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${mockOwnerToken}` },
            body: { email: faker.internet.email(), type: InvitationType.PROJECT, projectId: mockProject.id, projectRole: editorRole.name },
        })
        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(sendUserEventSpy.mock.calls[0][1].data.projectRole).toStrictEqual({ id: editorRole.id, name: editorRole.name })
    })

    it('records a custom project role by name', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockPlatform, mockProject, mockOwnerToken } = await createEnvironment()
        const customRole = createMockProjectRole({ platformId: mockPlatform.id, type: RoleType.CUSTOM, name: 'Reviewer' })
        await db.save('project_role', customRole)
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${mockOwnerToken}` },
            body: { email: faker.internet.email(), type: InvitationType.PROJECT, projectId: mockProject.id, projectRole: customRole.name },
        })
        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(sendUserEventSpy.mock.calls[0][1].data.projectRole).toStrictEqual({ id: customRole.id, name: 'Reviewer' })
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

type SaveInvitationParams = {
    platformId: string
    email: string
    status: InvitationStatus
    projectId?: string | null
}
