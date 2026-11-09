import { InvitationStatus, InvitationType, PlatformRole } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { JwtAudience, jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { db } from '../../../helpers/db'
import { createMockUserInvitation, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Invitation page', () => {
    it('reading an invitation by its link does not accept it', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const invitation = createMockUserInvitation({
            platformId: mockPlatform.id,
            email: faker.internet.email(),
            status: InvitationStatus.PENDING,
            type: InvitationType.PLATFORM,
            platformRole: PlatformRole.MEMBER,
        })
        await db.save('user_invitation', invitation)
        const token = await signInvitationToken({ invitationId: invitation.id })
        const response = await app.inject({ method: 'GET', url: '/api/v1/user-invitations/preview', query: { token } })
        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({ email: invitation.email, platformName: mockPlatform.name, platformLogoUrl: mockPlatform.logoIconUrl, memberCount: 1, status: InvitationStatus.PENDING })
        const stored = await db.findOneBy<{ status: InvitationStatus }>('user_invitation', { id: invitation.id })
        expect(stored?.status).toBe(InvitationStatus.PENDING)
    })

    it('answers an invalid link as not found', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/v1/user-invitations/preview', query: { token: 'not-a-token' } })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('answers an expired link as not found', async () => {
        const token = await signInvitationToken({ invitationId: faker.string.alphanumeric(21), expiresInSeconds: -60 })
        const response = await app.inject({ method: 'GET', url: '/api/v1/user-invitations/preview', query: { token } })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('answers accepting an expired link as not found', async () => {
        const token = await signInvitationToken({ invitationId: faker.string.alphanumeric(21), expiresInSeconds: -60 })
        const response = await app.inject({ method: 'POST', url: '/api/v1/user-invitations/accept', body: { invitationToken: token } })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('answers a link to a deleted invitation as not found', async () => {
        const token = await signInvitationToken({ invitationId: faker.string.alphanumeric(21) })
        const response = await app.inject({ method: 'GET', url: '/api/v1/user-invitations/preview', query: { token } })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('limits how often one address can read invitation links', async () => {
        const remoteAddress = faker.internet.ipv4()
        const clientIpHeader = system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)
        const headers = clientIpHeader ? { [clientIpHeader]: remoteAddress } : {}
        const statusCodes: number[] = []
        for (let attempt = 0; attempt <= AUTHN_LIMIT_PER_MINUTE; attempt++) {
            const response = await app.inject({ method: 'GET', url: '/api/v1/user-invitations/preview', query: { token: 'not-a-token' }, remoteAddress, headers })
            statusCodes.push(response.statusCode)
        }
        expect(statusCodes.slice(0, AUTHN_LIMIT_PER_MINUTE).every((statusCode) => statusCode === StatusCodes.NOT_FOUND)).toBe(true)
        expect(statusCodes[AUTHN_LIMIT_PER_MINUTE]).toBe(StatusCodes.TOO_MANY_REQUESTS)
    })
})

async function signInvitationToken({ invitationId, expiresInSeconds }: { invitationId: string, expiresInSeconds?: number }): Promise<string> {
    return jwtUtils.sign({
        payload: { id: invitationId },
        key: await jwtUtils.getJwtSecret(),
        audience: JwtAudience.USER_INVITATION,
        expiresInSeconds,
    })
}

const AUTHN_LIMIT_PER_MINUTE = 50
