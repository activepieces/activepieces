import { apId, ProjectRole, RoleType } from '@activepieces/core-utils'
import { ApplicationEvent, ApplicationEventName, DefaultProjectRole, InvitationStatus, InvitationType, PlatformRole, PrincipalType, UserInvitation } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as applicationEventsModule from '../../../../src/app/helper/application-events'
import { JwtAudience, jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { userInvitationsService } from '../../../../src/app/user-invitations/user-invitation.service'
import { actionsEmitted } from '../../../helpers/application-events'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockProjectRole, createMockUserIdentity, createMockUserInvitation, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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

    it('does not reject an accept that read the invitation before an overlapping accept joined and deleted it', async () => {
        const { mockPlatform } = await createEnvironment()
        const email = faker.internet.email().toLowerCase()
        await db.save('user_identity', createMockUserIdentity({ email }))
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email, status: InvitationStatus.PENDING })
        const service = userInvitationsService(mockLog)
        const first = await service.accept({ invitationId: invitation.id, platformId: mockPlatform.id })
        expect(await db.findOneBy('user_invitation', { id: invitation.id })).toBeNull()
        const overlapping = await service.accept.call(
            { ...service, getOneOrThrow: async () => invitation },
            { invitationId: invitation.id, platformId: mockPlatform.id },
        )
        expect([first.firstAcceptance, overlapping.firstAcceptance]).toEqual([true, false])
    })

    it('keeps the invitation link out of the audit event', async () => {
        const sendUserEventSpy = spyOnSendUserEvent()
        const { mockOwnerToken } = await createEnvironment()
        const sent = await inviteThroughApi({ token: mockOwnerToken, email: faker.internet.email() })
        expect(sent).toHaveProperty('link')
        expect(sendUserEventSpy.mock.calls[0][0].projectId).toBeUndefined()
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
        expect(sendUserEventSpy.mock.calls[0][0]).toMatchObject({ projectId: mockProject.id })
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

    it('saves an invitation sent with an API key to the audit log', async () => {
        const { mockPlatform } = await createEnvironment({ auditLogEnabled: true })
        const serviceToken = await generateMockToken({ id: apId(), type: PrincipalType.SERVICE, platform: { id: mockPlatform.id } })
        const sent = await inviteThroughApi({ token: serviceToken, email: faker.internet.email() })
        const [row] = await savedInvitationRows({ platformId: mockPlatform.id, action: ApplicationEventName.USER_INVITATION_SENT })
        expect(row?.data).toMatchObject({ invitation: { id: sent.id, email: sent.email } })
    })

    it('does not credit the project owner for a project invitation sent with an API key', async () => {
        const { mockPlatform, mockProject } = await createEnvironment({ auditLogEnabled: true })
        const serviceToken = await generateMockToken({ id: apId(), type: PrincipalType.SERVICE, platform: { id: mockPlatform.id } })
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${serviceToken}` },
            body: { email: faker.internet.email(), type: InvitationType.PROJECT, projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR },
        })
        expect(response.statusCode).toBe(StatusCodes.CREATED)
        const [row] = await savedInvitationRows({ platformId: mockPlatform.id, action: ApplicationEventName.USER_INVITATION_SENT })
        expect(row).toMatchObject({ projectId: mockProject.id })
        expect(row?.userId ?? null).toBeNull()
        expect(row?.userEmail ?? null).toBeNull()
    })

    it('files an accepted invitation under its project without crediting the project owner', async () => {
        const { mockPlatform, mockProject } = await createEnvironment({ auditLogEnabled: true })
        const invitation = await saveInvitation({ platformId: mockPlatform.id, email: faker.internet.email(), status: InvitationStatus.PENDING, projectId: mockProject.id })
        const accepted = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations/accept',
            body: { invitationToken: await signInvitationToken(invitation.id) },
        })
        expect(accepted.statusCode).toBe(StatusCodes.OK)
        const [row] = await savedInvitationRows({ platformId: mockPlatform.id, action: ApplicationEventName.USER_INVITATION_ACCEPTED })
        expect(row).toMatchObject({ projectId: mockProject.id, projectDisplayName: mockProject.displayName })
        expect(row?.userId ?? null).toBeNull()
        expect(row?.userEmail ?? null).toBeNull()
    })

    it('saves the project of a project invitation on the audit row', async () => {
        const { mockPlatform, mockProject, mockOwnerToken } = await createEnvironment({ auditLogEnabled: true })
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${mockOwnerToken}` },
            body: { email: faker.internet.email(), type: InvitationType.PROJECT, projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR },
        })
        expect(response.statusCode).toBe(StatusCodes.CREATED)
        const [row] = await savedInvitationRows({ platformId: mockPlatform.id, action: ApplicationEventName.USER_INVITATION_SENT })
        expect(row).toMatchObject({ projectId: mockProject.id, projectDisplayName: mockProject.displayName })
    })
})

async function createEnvironment({ auditLogEnabled = false }: CreateEnvironmentParams = {}): Promise<Environment> {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled: true, auditLogEnabled },
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

async function savedInvitationRows({ platformId, action }: SavedInvitationRowsParams): Promise<ApplicationEvent[]> {
    for (let attempt = 0; attempt < 40; attempt++) {
        const rows = await db.findBy<ApplicationEvent>('audit_event', { platformId, action })
        if (rows.length > 0) {
            return rows
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return []
}

async function signInvitationToken(invitationId: string): Promise<string> {
    const key = await jwtUtils.getJwtSecret()
    return jwtUtils.sign({
        payload: { id: invitationId },
        key,
        audience: JwtAudience.USER_INVITATION,
    })
}

type CreateEnvironmentParams = {
    auditLogEnabled?: boolean
}

type SavedInvitationRowsParams = {
    platformId: string
    action: ApplicationEventName
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
