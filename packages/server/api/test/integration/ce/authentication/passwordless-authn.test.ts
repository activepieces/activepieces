import { apId } from '@activepieces/core-utils'
import { OtpState, OtpType, PlatformRole, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { passwordHasher } from '../../../../src/app/authentication/lib/password-hasher'
import { otpService } from '../../../../src/app/authentication/otp/otp-service'
import { userIdentityService } from '../../../../src/app/authentication/user-identity/user-identity-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { passwordlessAuthService } from '../../../../src/app/authentication/passwordless-auth.service'
import { platformService } from '../../../../src/app/platform/platform.service'
import { createMockPlatform } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

const EMAIL = 'ahmad.tash@example.com'

let callers = 0

async function requestCode(email: string): Promise<number | undefined> {
    callers += 1
    const response = await app?.inject({
        method: 'POST',
        url: '/api/v1/authentication/otp/request',
        headers: { 'x-real-ip': `10.0.${Math.floor(callers / 256)}.${callers % 256}` },
        body: { email },
    })
    return response?.statusCode
}

async function verifyCode({ email, code }: { email: string, code: string }) {
    return app?.inject({
        method: 'POST',
        url: '/api/v1/authentication/otp/verify',
        body: { email, code },
    })
}

function wrongCodeFor(code: string): string {
    const shifted = (Number.parseInt(code, 10) + 1) % 1000000
    return shifted.toString().padStart(6, '0')
}

async function storedIdentity(email: string) {
    return databaseConnection().getRepository('user_identity').findOneBy({ email })
}

async function storedOtpRow(email: string) {
    const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email })
    if (identity === null) {
        return null
    }
    return databaseConnection().getRepository('otp').findOneBy({
        identityId: identity.id,
        type: OtpType.EMAIL_LOGIN,
    })
}

async function storedOtp(email: string) {
    const row = await storedOtpRow(email)
    if (row === null) {
        return null
    }
    const delivered = await distributedStore.get<string>(`otp-pending-code:${row.identityId}:${OtpType.EMAIL_LOGIN}`)
    return { ...row, value: delivered ?? row.value }
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('flag').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('otp').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('project').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('platform').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('user_identity').createQueryBuilder().delete().execute()
})

describe('Passwordless Authentication API', () => {
    describe('Request code endpoint', () => {
        it('creates an unverified identity and issues a 6 digit code', async () => {
            const statusCode = await requestCode(EMAIL)

            expect(statusCode).toBe(StatusCodes.NO_CONTENT)
            const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
            expect(identity?.verified).toBe(false)
            expect(identity?.firstName).toBe('Ahmad')

            const otp = await storedOtp(EMAIL)
            expect(otp?.value).toMatch(/^[0-9]{6}$/)
            expect(otp?.state).toBe(OtpState.PENDING)
            expect(otp?.attempts).toBe(0)
            expect((await storedOtpRow(EMAIL))?.value).toMatch(/^[0-9a-f]{64}$/)
        })

        it('seeds the name from the email local part until the name step runs', async () => {
            await requestCode(EMAIL)

            const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
            expect(identity?.firstName).toBe('Ahmad')
            expect(identity?.lastName).toBe('')
        })

        it('refuses a throwaway address and creates nothing', async () => {
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/otp/request',
                body: { email: 'someone@mailinator.com' },
            })

            expect(response?.statusCode).not.toBe(StatusCodes.NO_CONTENT)
            expect(response?.json()?.code).toBe('DOMAIN_NOT_ALLOWED')
            const identity = await databaseConnection().getRepository('user_identity')
                .findOneBy({ email: 'someone@mailinator.com' })
            expect(identity).toBeNull()
        })

        it('lets an invited member through even on a throwaway domain', async () => {
            const invited = 'guest@mailinator.com'
            await databaseConnection().getRepository('user_invitation').save({
                id: apId(),
                email: invited,
                type: 'PLATFORM',
                platformId: apId(),
                status: 'ACCEPTED',
                platformRole: PlatformRole.MEMBER,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/otp/request',
                body: { email: invited },
            })

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('issues a code with no captcha token when no challenge is configured', async () => {
            const statusCode = await requestCode(EMAIL)

            expect(statusCode).toBe(StatusCodes.NO_CONTENT)
            expect((await storedOtp(EMAIL))?.value).toMatch(/^[0-9]{6}$/)
        })

        it('does not set the USER_CREATED flag before a code is verified', async () => {
            await requestCode(EMAIL)

            const flag = await databaseConnection().getRepository('flag').findOneBy({ id: 'USER_CREATED' })
            expect(flag).toBeNull()
        })

        it('answers alike for an unknown address, revealing nothing', async () => {
            const first = await requestCode(EMAIL)
            const second = await requestCode('someone-else@example.com')

            expect(first).toBe(StatusCodes.NO_CONTENT)
            expect(second).toBe(StatusCodes.NO_CONTENT)
        })

        it('re-sends the same code instead of minting a new one', async () => {
            await requestCode(EMAIL)
            const issued = await storedOtp(EMAIL)

            await requestCode(EMAIL)
            const afterResend = await storedOtp(EMAIL)

            expect(afterResend?.value).toBe(issued?.value)
        })
    })

    describe('Verify code endpoint', () => {
        it('signs in, verifies the identity and consumes the code', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)

            const response = await verifyCode({ email: EMAIL, code: otp!.value })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body?.email).toBe(EMAIL)
            expect(body?.verified).toBe(true)
            expect(body?.token).toBeDefined()
            expect(await storedOtp(EMAIL)).toBeNull()
        })

        it('discards a password planted on the address before its owner proved the inbox', async () => {
            const plantedPassword = 'PlantedPassword123!'
            await userIdentityService(app!.log).create({
                email: EMAIL,
                password: plantedPassword,
                firstName: 'Ahmad',
                lastName: '',
                trackEvents: true,
                newsLetter: false,
                provider: UserIdentityProvider.EMAIL,
                verified: false,
            })
            const planted = await storedIdentity(EMAIL)
            expect(await passwordHasher.compare(plantedPassword, planted!.password)).toBe(true)

            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const response = await verifyCode({ email: EMAIL, code: otp!.value })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const afterVerification = await storedIdentity(EMAIL)
            expect(afterVerification!.verified).toBe(true)
            expect(await passwordHasher.compare(plantedPassword, afterVerification!.password)).toBe(false)
        })

        it('hands a brand-new member a pre-platform session so the name step can run', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)

            const response = await verifyCode({ email: EMAIL, code: otp!.value })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body?.platformId).toBeNull()
            expect(body?.projectId).toBeNull()
            expect(body?.token).toBeDefined()
            expect(await databaseConnection().getRepository('platform').count()).toBe(0)
        })

        it('creates the platform from the name once the name step completes', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const onboarding = await verifyCode({ email: EMAIL, code: otp!.value })
            const onboardingToken = onboarding?.json()?.token

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/complete-sign-up',
                headers: { authorization: `Bearer ${onboardingToken}` },
                body: { fullName: 'Ahmad Bin Tash' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body?.projectId).not.toBeNull()
            const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
            expect(identity?.firstName).toBe('Ahmad')
            expect(identity?.lastName).toBe('Bin Tash')
            const platform = await databaseConnection().getRepository('platform').findOneBy({ id: body?.platformId })
            expect(platform?.name).toBe("Ahmad's Platform")
            const project = await databaseConnection().getRepository('project').findOneBy({ platformId: body?.platformId })
            expect(project?.displayName).toBe("Ahmad's Project")
        })

        it('consumes one code exactly once, even when two confirmations race it', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
            const confirm = () => otpService(app!.log).confirm({
                identityId: identity!.id,
                type: OtpType.EMAIL_LOGIN,
                value: otp!.value,
            })

            const verdicts = await Promise.all([confirm(), confirm()])

            expect(verdicts.filter((verdict) => verdict)).toHaveLength(1)
        })

        it('creates one platform for one identity, even when the name step is submitted twice', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const onboarding = await verifyCode({ email: EMAIL, code: otp!.value })
            const onboardingToken = onboarding?.json()?.token
            const completeSignUp = () => app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/complete-sign-up',
                headers: { authorization: `Bearer ${onboardingToken}` },
                body: { fullName: 'Ahmad Bin Tash' },
            })

            const first = await completeSignUp()
            const second = await completeSignUp()

            expect(first?.statusCode).toBe(StatusCodes.OK)
            expect(second?.statusCode).toBe(StatusCodes.OK)
            expect(second?.json()?.platformId).toBe(first?.json()?.platformId)
            expect(await databaseConnection().getRepository('platform').count()).toBe(1)
            expect(await databaseConnection().getRepository('project').count()).toBe(1)
            expect(await databaseConnection().getRepository('user').count()).toBe(1)
        })

        it('creates one platform even when the other onboarding route races the name step', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const onboarding = await verifyCode({ email: EMAIL, code: otp!.value })
            const onboardingToken = onboarding?.json()?.token

            const viaNameStep = await app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/complete-sign-up',
                headers: { authorization: `Bearer ${onboardingToken}` },
                body: { fullName: 'Ahmad Bin Tash' },
            })
            const viaPlatformRoute = await app?.inject({
                method: 'POST',
                url: '/api/v1/platforms',
                headers: { authorization: `Bearer ${onboardingToken}` },
                body: { name: 'Ahmad' },
            })

            expect(viaNameStep?.statusCode).toBe(StatusCodes.OK)
            expect(viaPlatformRoute?.statusCode).toBe(StatusCodes.OK)
            expect(viaPlatformRoute?.json()?.platformId).toBe(viaNameStep?.json()?.platformId)
            expect(await databaseConnection().getRepository('platform').count()).toBe(1)
            expect(await databaseConnection().getRepository('user').count()).toBe(1)
        })

        it('does not rename an account whose chosen name matches its address', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const onboarding = await verifyCode({ email: EMAIL, code: otp!.value })
            const onboardingToken = onboarding?.json()?.token
            const complete = (fullName: string) => app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/complete-sign-up',
                headers: { authorization: `Bearer ${onboardingToken}` },
                body: { fullName },
            })
            await complete('Ahmad')

            await complete('Someone Else')

            const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
            expect(identity?.firstName).toBe('Ahmad')
            expect(identity?.lastName).toBe('')
        })

        it('does not rename the account when completion is replayed', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)
            const onboarding = await verifyCode({ email: EMAIL, code: otp!.value })
            const onboardingToken = onboarding?.json()?.token
            const complete = (fullName: string) => app?.inject({
                method: 'POST',
                url: '/api/v1/authentication/complete-sign-up',
                headers: { authorization: `Bearer ${onboardingToken}` },
                body: { fullName },
            })
            await complete('Ahmad Tash')

            const replay = await complete('Someone Else')

            expect(replay?.statusCode).toBe(StatusCodes.OK)
            const identity = await databaseConnection().getRepository('user_identity').findOneBy({ email: EMAIL })
            expect(identity?.firstName).toBe('Ahmad')
            expect(identity?.lastName).toBe('Tash')
        })

        it('sets the USER_CREATED flag only once a code is verified', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)

            await verifyCode({ email: EMAIL, code: otp!.value })

            const flag = await databaseConnection().getRepository('flag').findOneBy({ id: 'USER_CREATED' })
            expect(flag?.value).toBe(true)
        })

        it('rejects a wrong code and counts the attempt', async () => {
            await requestCode(EMAIL)
            const issued = await storedOtp(EMAIL)

            const response = await verifyCode({ email: EMAIL, code: wrongCodeFor(issued!.value) })

            expect(response?.statusCode).toBe(StatusCodes.GONE)
            expect((await storedOtp(EMAIL))?.attempts).toBe(1)
        })

        it('discards the credential after five wrong attempts', async () => {
            await requestCode(EMAIL)
            const otp = await storedOtp(EMAIL)

            for (let attempt = 0; attempt < 5; attempt++) {
                await verifyCode({ email: EMAIL, code: wrongCodeFor(otp!.value) })
            }

            expect(await storedOtp(EMAIL)).toBeNull()
            const response = await verifyCode({ email: EMAIL, code: otp!.value })
            expect(response?.statusCode).toBe(StatusCodes.GONE)
        })

        it('rejects an address that never requested a code', async () => {
            const response = await verifyCode({ email: 'nobody@example.com', code: '123456' })

            expect(response?.statusCode).toBe(StatusCodes.GONE)
        })
    })
})
