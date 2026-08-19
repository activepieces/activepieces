import { OtpType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { otpService } from '../../../../src/app/authentication/otp/otp-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

const EMAIL = 'otp.budget@example.com'
const MAX_ATTEMPTS = 5
const MAX_ATTEMPTS_PER_IDENTITY = 10

async function issuedCode(): Promise<string> {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
    const code = await distributedStore.get<string>(`otp-pending-code:${identity!.id}:${OtpType.EMAIL_LOGIN}`)
    return code!
}

async function seedIdentityWithCode(): Promise<string> {
    const identity = createMockUserIdentity({ email: EMAIL, verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    await otpService(app!.log).createAndSend({
        platformId: null,
        email: EMAIL,
        type: OtpType.EMAIL_LOGIN,
    })
    return issuedCode()
}

async function currentOtp() {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
    return databaseConnection().getRepository('otp').findOneBy({
        identityId: identity!.id,
        type: OtpType.EMAIL_LOGIN,
    })
}

async function confirmCode(value: string): Promise<boolean> {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
    return otpService(app!.log).confirm({
        identityId: identity!.id,
        type: OtpType.EMAIL_LOGIN,
        value,
    })
}

function wrongVersionOf(value: string): string {
    const shifted = (Number.parseInt(value, 10) + 1) % 1000000
    return shifted.toString().padStart(6, '0')
}

async function sendCode(): Promise<void> {
    await otpService(app!.log).createAndSend({
        platformId: null,
        email: EMAIL,
        type: OtpType.EMAIL_LOGIN,
    })
}

async function burnOneCodeWithWrongGuesses(): Promise<void> {
    await sendCode()
    const code = await issuedCode()
    for (let guess = 0; guess < MAX_ATTEMPTS; guess++) {
        await confirmCode(wrongVersionOf(code))
    }
}

async function freshCorrectCode(): Promise<string> {
    await sendCode()
    return issuedCode()
}

async function backdateCode(minutesAgo: number): Promise<Date> {
    const otp = await currentOtp()
    const sentAt = new Date(Date.now() - minutesAgo * 60 * 1000)
    await databaseConnection().getRepository('otp')
        .query('UPDATE "otp" SET "updated" = $1 WHERE "id" = $2', [sentAt.toISOString(), otp!.id])
    return sentAt
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

describe('otpService#createAndSend', () => {
    it('re-sends the code already in flight instead of minting a second one', async () => {
        const issued = await seedIdentityWithCode()
        const storedBefore = (await currentOtp())!.value

        await sendCode()

        expect(await issuedCode()).toBe(issued)
        expect((await currentOtp())!.value).toBe(storedBefore)
    })

    it('mints a fresh code once the one in flight has expired', async () => {
        const issued = await seedIdentityWithCode()
        await backdateCode(11)

        await sendCode()

        expect(await issuedCode()).not.toBe(issued)
    })
})

describe('otpService#createAndSend at rest', () => {
    it('never stores the code a person receives', async () => {
        const issued = await seedIdentityWithCode()

        const stored = (await currentOtp())!.value

        expect(stored).not.toBe(issued)
        expect(stored).toMatch(/^[0-9a-f]{64}$/)
    })

    it('hands out one code when two requests race, and that code works', async () => {
        const identity = createMockUserIdentity({ email: EMAIL, verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        await Promise.all([sendCode(), sendCode(), sendCode()])

        const delivered = await issuedCode()
        expect(await confirmCode(delivered)).toBe(true)
    })

    it('accepts the code it sent even though the row holds a digest', async () => {
        const issued = await seedIdentityWithCode()

        expect(await confirmCode(issued)).toBe(true)
    })

    it('refuses the digest itself, offered as if it were the code', async () => {
        await seedIdentityWithCode()
        const stored = (await currentOtp())!.value

        expect(await confirmCode(stored)).toBe(false)
    })
})

describe('otpService#confirm', () => {
    it('throws an expired code away rather than leaving it to linger', async () => {
        const value = await seedIdentityWithCode()
        await backdateCode(11)

        expect(await confirmCode(value)).toBe(false)
        expect(await currentOtp()).toBeNull()
    })

    it('accepts the correct code and consumes it', async () => {
        const value = await seedIdentityWithCode()

        expect(await confirmCode(value)).toBe(true)
        expect(await currentOtp()).toBeNull()
    })

    it('accepts the correct code exactly once', async () => {
        const value = await seedIdentityWithCode()
        await confirmCode(value)

        expect(await confirmCode(value)).toBe(false)
    })

    it('refuses a wrong code and spends one attempt', async () => {
        const value = await seedIdentityWithCode()

        expect(await confirmCode(wrongVersionOf(value))).toBe(false)
        expect((await currentOtp())!.attempts).toBe(1)
    })

    it('refuses a correct code once the attempt budget is already spent', async () => {
        const value = await seedIdentityWithCode()
        const otp = await currentOtp()
        await databaseConnection().getRepository('otp').update(otp!.id, { attempts: MAX_ATTEMPTS })

        const accepted = await confirmCode(value)

        expect(accepted).toBe(false)
    })

    it('throws the code away on the attempt that exhausts the budget', async () => {
        const value = await seedIdentityWithCode()

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            await confirmCode(wrongVersionOf(value))
        }

        expect(await currentOtp()).toBeNull()
        expect(await confirmCode(value)).toBe(false)
    })

    it('refuses a correct code that has outlived its ten minutes', async () => {
        const value = await seedIdentityWithCode()
        await backdateCode(11)

        expect(await confirmCode(value)).toBe(false)
    })

    it('refuses a correct code once the identity has spent its budget across several codes', async () => {
        await seedIdentityWithCode()
        const rounds = MAX_ATTEMPTS_PER_IDENTITY / MAX_ATTEMPTS
        for (let round = 0; round < rounds; round++) {
            await burnOneCodeWithWrongGuesses()
        }

        const accepted = await confirmCode(await freshCorrectCode())

        expect(accepted).toBe(false)
    })

    it('clears the identity budget when the right code lands, so an owner who fumbles is not locked out', async () => {
        await seedIdentityWithCode()
        await burnOneCodeWithWrongGuesses()

        expect(await confirmCode(await freshCorrectCode())).toBe(true)

        await burnOneCodeWithWrongGuesses()
        expect(await confirmCode(await freshCorrectCode())).toBe(true)
    })

    it('does not extend the life of a code by guessing at it', async () => {
        const value = await seedIdentityWithCode()
        const backdated = await backdateCode(9)

        await confirmCode(wrongVersionOf(value))

        expect(new Date((await currentOtp())!.updated).getTime()).toBe(backdated.getTime())
    })
})
