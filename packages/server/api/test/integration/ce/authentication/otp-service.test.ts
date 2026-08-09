import { OtpType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { otpService } from '../../../../src/app/authentication/otp/otp-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

const EMAIL = 'otp.budget@example.com'
const MAX_ATTEMPTS = 5

async function seedIdentityWithCode(): Promise<string> {
    const identity = createMockUserIdentity({ email: EMAIL, verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    await otpService(app!.log).createAndSend({
        platformId: null,
        email: EMAIL,
        type: OtpType.EMAIL_VERIFICATION,
    })
    const otp = await databaseConnection().getRepository('otp').findOneBy({
        identityId: identity.id,
        type: OtpType.EMAIL_VERIFICATION,
    })
    return otp!.value
}

async function currentOtp() {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
    return databaseConnection().getRepository('otp').findOneBy({
        identityId: identity!.id,
        type: OtpType.EMAIL_VERIFICATION,
    })
}

async function confirmCode(value: string): Promise<boolean> {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
    return otpService(app!.log).confirm({
        identityId: identity!.id,
        type: OtpType.EMAIL_VERIFICATION,
        value,
    })
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

describe('otpService#confirm attempt budget', () => {
    it('refuses a correct code once the attempt budget is already spent', async () => {
        const value = await seedIdentityWithCode()
        const otp = await currentOtp()
        await databaseConnection().getRepository('otp').update(otp!.id, { attempts: MAX_ATTEMPTS })

        const accepted = await confirmCode(value)

        expect(accepted).toBe(false)
    })
})
