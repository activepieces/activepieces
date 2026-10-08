import { DefaultProjectRole, InvitationType, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { userService } from '../../../../src/app/user/user-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockUserIdentity, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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

describe('Cloud sign-in for someone with no project', () => {
    it('lands them on their platform instead of none', async () => {
        const platformId = await platformWithoutPersonalProjects()
        const identityId = await joinPlatforms({ platformIds: [platformId] })

        const picked = await authenticationService(mockLog).selectCloudSignInPlatformId({ identityId })

        expect(picked).toBe(platformId)
    })

    it('prefers a platform where they have a project when none was used last', async () => {
        const emptyPlatformId = await platformWithoutPersonalProjects()
        const { mockPlatform: busyPlatform } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true }, project: { type: ProjectType.TEAM } })
        const identityId = await joinPlatforms({ platformIds: [emptyPlatformId, busyPlatform.id] })

        const picked = await authenticationService(mockLog).selectCloudSignInPlatformId({ identityId })

        expect(picked).toBe(busyPlatform.id)
    })

    it('skips the last-used platform when they have no project there but do elsewhere', async () => {
        const emptyPlatformId = await platformWithoutPersonalProjects()
        const { mockPlatform: busyPlatform } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true }, project: { type: ProjectType.TEAM } })
        const identityId = await joinPlatforms({ platformIds: [emptyPlatformId, busyPlatform.id] })
        await db.update('user_identity', identityId, { lastLoggedInPlatformId: emptyPlatformId })

        const picked = await authenticationService(mockLog).selectCloudSignInPlatformId({ identityId })

        expect(picked).toBe(busyPlatform.id)
    })
})

describe('Accepting an invite through its link', () => {
    it('lands the next sign-in on the platform that invited them', async () => {
        const { mockPlatform: homePlatform } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true }, project: { type: ProjectType.TEAM } })
        const identity = createMockUserIdentity({ verified: true })
        await db.save('user_identity', identity)
        await userService(mockLog).getOrCreateWithProject({ identity, platformId: homePlatform.id })
        await db.update('user_identity', identity.id, { lastLoggedInPlatformId: homePlatform.id })
        const { mockPlatform: invitingPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true }, project: { type: ProjectType.TEAM } })
        const ownerToken = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: invitingPlatform.id } })
        const invite = await app?.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${ownerToken}` },
            body: { email: identity.email, type: InvitationType.PLATFORM, platformRole: PlatformRole.MEMBER, projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR },
        })
        const invitationToken = new URL(invite?.json().link).searchParams.get('token')

        const accept = await app?.inject({ method: 'POST', url: '/api/v1/user-invitations/accept', body: { invitationToken } })

        expect(accept?.statusCode).toBe(StatusCodes.OK)
        const picked = await authenticationService(mockLog).selectCloudSignInPlatformId({ identityId: identity.id })
        expect(picked).toBe(invitingPlatform.id)
    })
})

async function platformWithoutPersonalProjects(): Promise<string> {
    const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true }, project: { type: ProjectType.TEAM } })
    await db.update('platform', mockPlatform.id, { autoCreatePersonalProjects: false })
    return mockPlatform.id
}

async function joinPlatforms({ platformIds }: { platformIds: string[] }): Promise<string> {
    const identity = createMockUserIdentity({ verified: true })
    await db.save('user_identity', identity)
    for (const platformId of platformIds) {
        await userService(mockLog).getOrCreateWithProject({ identity, platformId })
    }
    return identity.id
}
