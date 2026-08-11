import { apId } from '@activepieces/core-utils'
import { PlatformRole, TelemetryEventName, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { authenticationUtils } from '../../../../src/app/authentication/authentication-utils'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { platformService } from '../../../../src/app/platform/platform.service'
import { createMockPlatform, createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const trackProject = vi.fn()

vi.mock('../../../../src/app/helper/telemetry.utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../src/app/helper/telemetry.utils')>()
    return {
        ...actual,
        telemetry: (log: FastifyBaseLogger) => ({ ...actual.telemetry(log), trackProject }),
    }
})

let app: FastifyInstance | null = null

const EMAIL = 'first.platform@example.com'

async function seedVerifiedIdentity(): Promise<string> {
    const identity = createMockUserIdentity({ email: EMAIL, verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    return identity.id
}

async function onboardingToken(identityId: string): Promise<string> {
    const response = await authenticationUtils(app!.log).getOnboardingResponse({ identityId })
    return response.token
}

async function createViaRoute({ token, name }: { token: string, name: string }) {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/platforms',
        headers: { authorization: `Bearer ${token}` },
        body: { name },
    })
}

async function createFirstPlatform(identityId: string, callerTokenVersion?: string) {
    const { response } = await platformService(app!.log).createPlatformWithProject({
        identityId,
        name: 'Ahmad',
        invalidatePreviousTokens: true,
        isFirstPlatform: true,
        callerTokenVersion,
    })
    return response
}

function provisionFirstPlatform(identityId: string) {
    return platformService(app!.log).createPlatformWithProject({
        identityId,
        name: 'Ahmad',
        invalidatePreviousTokens: true,
        isFirstPlatform: true,
        callerTokenVersion: undefined,
    })
}

async function tokenVersionOf(identityId: string): Promise<string> {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ id: identityId })
    return identity!.tokenVersion
}

async function strandUser(identityId: string): Promise<string> {
    const userId = apId()
    await databaseConnection().getRepository('user').save({
        id: userId,
        identityId,
        platformId: null,
        platformRole: PlatformRole.ADMIN,
        status: UserStatus.ACTIVE,
    })
    return userId
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    trackProject.mockClear()
    await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('platform').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
})

describe('First platform provisioning', () => {
    it('gives one identity a single platform however many times it asks', async () => {
        const identityId = await seedVerifiedIdentity()

        const first = await createFirstPlatform(identityId)
        const second = await createFirstPlatform(identityId)

        expect(second.platformId).toBe(first.platformId)
        expect(await databaseConnection().getRepository('platform').count()).toBe(1)
        expect(await databaseConnection().getRepository('project').count()).toBe(1)
        expect(await databaseConnection().getRepository('user').count()).toBe(1)
    })

    it('tells exactly one of two racing callers that it provisioned the platform', async () => {
        const identityId = await seedVerifiedIdentity()

        const results = await Promise.all([
            provisionFirstPlatform(identityId),
            provisionFirstPlatform(identityId),
        ])

        expect(results.filter((result) => result.provisioned)).toHaveLength(1)
    })

    it('reuses a user left unlinked by an interrupted attempt instead of creating a second one', async () => {
        const identityId = await seedVerifiedIdentity()
        await strandUser(identityId)

        await createFirstPlatform(identityId)

        expect(await databaseConnection().getRepository('user').count()).toBe(1)
    })

    it('adopts a platform whose owner link never landed instead of building a second one', async () => {
        const identityId = await seedVerifiedIdentity()
        const strandedUserId = await strandUser(identityId)
        await databaseConnection().getRepository('platform').save(
            createMockPlatform({ ownerId: strandedUserId }),
        )

        const response = await createFirstPlatform(identityId)

        expect(await databaseConnection().getRepository('platform').count()).toBe(1)
        expect(await databaseConnection().getRepository('user').count()).toBe(1)
        const relinked = await databaseConnection().getRepository('user').findOneBy({ id: strandedUserId })
        expect(relinked?.platformId).toBe(response.platformId)
    })

    it('reports the signup it finished for a platform whose owner link never landed', async () => {
        const identityId = await seedVerifiedIdentity()
        const strandedUserId = await strandUser(identityId)
        await databaseConnection().getRepository('platform').save(
            createMockPlatform({ ownerId: strandedUserId }),
        )

        const response = await createFirstPlatform(identityId)

        const signedUp = trackProject.mock.calls.filter(([, event]) => event.name === TelemetryEventName.SIGNED_UP)
        expect(signedUp).toHaveLength(1)
        expect(signedUp[0][0]).toBe(response.projectId)
    })

    it('repairs a platform left without a project instead of wedging the identity', async () => {
        const identityId = await seedVerifiedIdentity()
        const first = await createFirstPlatform(identityId)
        await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()

        const retry = await createFirstPlatform(identityId)

        expect(retry.platformId).toBe(first.platformId)
        expect(await databaseConnection().getRepository('project').count()).toBe(1)
        expect(await databaseConnection().getRepository('platform').count()).toBe(1)
    })

    it('finishes the rotation an interrupted attempt never got to', async () => {
        const identityId = await seedVerifiedIdentity()
        const strandedUserId = await strandUser(identityId)
        await databaseConnection().getRepository('platform').save(
            createMockPlatform({ ownerId: strandedUserId }),
        )
        await databaseConnection().getRepository('user')
            .update(strandedUserId, { platformId: (await databaseConnection().getRepository('platform').findOneBy({ ownerId: strandedUserId }))!.id })
        const beforeRetry = await tokenVersionOf(identityId)

        await createFirstPlatform(identityId, beforeRetry)

        expect(await tokenVersionOf(identityId)).not.toBe(beforeRetry)
    })

    it('leaves the token version alone for a duplicate that carries a spent version', async () => {
        const identityId = await seedVerifiedIdentity()
        await createFirstPlatform(identityId, await tokenVersionOf(identityId))
        const afterFirst = await tokenVersionOf(identityId)

        await createFirstPlatform(identityId, 'a-version-from-before-the-rotation')

        expect(await tokenVersionOf(identityId)).toBe(afterFirst)
    })

    it('rotates once when two first-platform creations race, so neither session is stranded', async () => {
        const identityId = await seedVerifiedIdentity()

        const [first, second] = await Promise.all([
            createFirstPlatform(identityId),
            createFirstPlatform(identityId),
        ])

        const after = await databaseConnection().getRepository('user_identity').findOneBy({ id: identityId })
        const versionOf = (token: string) =>
            JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).tokenVersion
        expect(versionOf(first.token)).toBe(after?.tokenVersion)
        expect(versionOf(second.token)).toBe(after?.tokenVersion)
    })

    it('serves the onboarding route without provisioning a second platform', async () => {
        const identityId = await seedVerifiedIdentity()
        const token = await onboardingToken(identityId)

        const created = await createViaRoute({ token, name: 'Ahmad' })

        expect(created?.statusCode).toBe(StatusCodes.OK)
        expect(await databaseConnection().getRepository('platform').count()).toBe(1)
        const identity = await databaseConnection().getRepository('user_identity').findOneBy({ id: identityId })
        expect(identity?.tokenVersion).not.toBe(
            JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).tokenVersion,
        )
    })
})
