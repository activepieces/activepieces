import { apId, OtpState, OtpType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { otpService } from '../../../../src/app/authentication/otp/otp-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

async function seedRow({ email, value, version, type = OtpType.EMAIL_LOGIN }: SeedParams): Promise<string> {
    const identity = createMockUserIdentity({ email, verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    await databaseConnection().getRepository('otp').save({
        id: apId(),
        updated: dayjs().toISOString(),
        type,
        identityId: identity.id,
        value,
        state: OtpState.PENDING,
        attempts: 0,
        version,
    })
    return identity.id
}

function confirm({ identityId, value, type = OtpType.EMAIL_LOGIN }: ConfirmParams): Promise<boolean> {
    return otpService(app!.log).confirm({ identityId, type, value })
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('otp').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
})

describe('one-time codes written before hashing', () => {
    it('accepts a code an older build stored in the clear, so a rollout in progress still signs people in', async () => {
        const identityId = await seedRow({ email: 'legacy@example.com', value: '424242', version: 0 })

        expect(await confirm({ identityId, value: '424242' })).toBe(true)
    })

    it('still refuses a wrong guess against a code written in the clear', async () => {
        const identityId = await seedRow({ email: 'legacy-wrong@example.com', value: '424242', version: 0 })

        expect(await confirm({ identityId, value: '424243' })).toBe(false)
    })

    it('does not read a hashed code as though it were written in the clear', async () => {
        const identityId = await seedRow({ email: 'hashed@example.com', value: '424242', version: 1 })

        expect(await confirm({ identityId, value: '424242' })).toBe(false)
    })

    it('marks every freshly issued code as hashed', async () => {
        const email = 'fresh@example.com'
        const identity = createMockUserIdentity({ email, verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        await otpService(app!.log).createAndSend({ platformId: null, email, type: OtpType.EMAIL_LOGIN })

        const row = await databaseConnection().getRepository('otp').findOneBy({ identityId: identity.id })
        expect(row?.version).toBe(1)
        expect(row?.value).toMatch(/^[0-9a-f]{64}$/)
    })
})

type SeedParams = {
    email: string
    value: string
    version: number
    type?: OtpType
}

type ConfirmParams = {
    identityId: string
    value: string
    type?: OtpType
}
