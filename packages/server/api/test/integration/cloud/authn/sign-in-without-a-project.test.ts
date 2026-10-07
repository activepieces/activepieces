import { ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { userService } from '../../../../src/app/user/user-service'
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
