import { apId, OtpState, OtpType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import dayjs from 'dayjs'
import { otpService } from '../../../../src/app/authentication/otp/otp-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { HashOutstandingOtps1827000000000 } from '../../../../src/app/database/migration/postgres/1827000000000-HashOutstandingOtps'
import { createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

async function seedPlaintextOtp({ email, type, value, minutesAgo }: SeedParams): Promise<string> {
    const identity = createMockUserIdentity({ email, verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    await databaseConnection().getRepository('otp').save({
        id: apId(),
        updated: dayjs().subtract(minutesAgo, 'minutes').toISOString(),
        type,
        identityId: identity.id,
        value,
        state: OtpState.PENDING,
        attempts: 0,
    })
    return identity.id
}

async function runMigration(): Promise<void> {
    const queryRunner = databaseConnection().createQueryRunner()
    await queryRunner.connect()
    try {
        await new HashOutstandingOtps1827000000000().up(queryRunner)
    }
    finally {
        await queryRunner.release()
    }
}

async function storedValue(identityId: string): Promise<string | undefined> {
    const row = await databaseConnection().getRepository('otp').findOneBy({ identityId })
    return row?.value
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

describe('HashOutstandingOtps migration', () => {
    it('leaves a code that was in flight usable, so a sign-in underway at release still lands', async () => {
        const identityId = await seedPlaintextOtp({
            email: 'inflight@example.com',
            type: OtpType.EMAIL_LOGIN,
            value: '424242',
            minutesAgo: 2,
        })

        await runMigration()

        expect(await storedValue(identityId)).not.toBe('424242')
        const accepted = await otpService(app!.log).confirm({
            identityId,
            type: OtpType.EMAIL_LOGIN,
            value: '424242',
        })
        expect(accepted).toBe(true)
    })

    it('clears a login code that had already outlived its window', async () => {
        const identityId = await seedPlaintextOtp({
            email: 'stale@example.com',
            type: OtpType.EMAIL_LOGIN,
            value: '111111',
            minutesAgo: 11,
        })

        await runMigration()

        expect(await storedValue(identityId)).toBeUndefined()
    })

    it('keeps an email verification link alive, since those live a day rather than ten minutes', async () => {
        const setupCode = apId()
        const identityId = await seedPlaintextOtp({
            email: 'verify@example.com',
            type: OtpType.EMAIL_VERIFICATION,
            value: setupCode,
            minutesAgo: 60,
        })

        await runMigration()

        expect(await storedValue(identityId)).not.toBe(setupCode)
        const accepted = await otpService(app!.log).confirm({
            identityId,
            type: OtpType.EMAIL_VERIFICATION,
            value: setupCode,
        })
        expect(accepted).toBe(true)
    })

    it('leaves no readable code behind', async () => {
        await seedPlaintextOtp({ email: 'a@example.com', type: OtpType.EMAIL_LOGIN, value: '222222', minutesAgo: 1 })
        await seedPlaintextOtp({ email: 'b@example.com', type: OtpType.PASSWORD_RESET, value: apId(), minutesAgo: 3 })

        await runMigration()

        const rows = await databaseConnection().getRepository('otp').find()
        expect(rows).toHaveLength(2)
        for (const row of rows) {
            expect(row.value).toMatch(/^[0-9a-f]{64}$/)
        }
    })
})

type SeedParams = {
    email: string
    type: OtpType
    value: string
    minutesAgo: number
}
