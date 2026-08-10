import { apId, isNil, PlatformId } from '@activepieces/core-utils'
import { OtpModel, OtpState, OtpType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { distributedLock } from '../../database/redis-connections'
import { emailService } from '../../ee/helper/email/email-service'
import { userIdentityService } from '../user-identity/user-identity-service'
import { otpGenerator } from './lib/otp-generator'
import { OtpEntity } from './otp-entity'

const OTP_EXPIRATION_MS: Record<OtpType, number> = {
    [OtpType.EMAIL_VERIFICATION]: 24 * 60 * 60 * 1000,
    [OtpType.PASSWORD_RESET]: 10 * 60 * 1000,
    [OtpType.EMAIL_LOGIN]: 10 * 60 * 1000,
}
const MAX_ATTEMPTS = 5

const repo = repoFactory(OtpEntity)

export const otpService = (log: FastifyBaseLogger) => ({
    async createAndSend({
        platformId,
        email,
        type,
    }: CreateParams): Promise<void> {
        const userIdentity = await userIdentityService(log).getIdentityByEmail(email)
        if (!userIdentity) {
            return
        }
        const existingOtp = await repo().findOneBy({
            identityId: userIdentity.id,
            type,
        })
        const existingOtpIsReusable = !isNil(existingOtp) && existingOtp.state === OtpState.PENDING && !otpIsExpired(existingOtp)
        if (existingOtpIsReusable) {
            await emailService(log).sendOtp({
                platformId,
                userIdentity,
                otp: existingOtp.value,
                type: existingOtp.type,
            })
            return
        }
        const newOtp: Omit<OtpModel, 'created'> = {
            id: apId(),
            updated: dayjs().toISOString(),
            type,
            identityId: userIdentity.id,
            value: otpGenerator.generate({ type }),
            state: OtpState.PENDING,
            attempts: 0,
        }
        await repo().upsert(newOtp, ['identityId', 'type'])
        await emailService(log).sendOtp({
            platformId,
            userIdentity,
            otp: newOtp.value,
            type: newOtp.type,
        })
    },

    // Serialised per credential, because the budget and the single-use guarantee
    // both need read-then-write to be indivisible, and neither `affected` nor
    // RETURNING can carry that: an UPDATE reports both on postgres and neither on
    // the embedded driver the tests run against. Inside the lock a plain read and
    // delete are enough, and the increment stays raw SQL so it cannot touch
    // `updated` and silently extend the credential's life.
    async confirm({ identityId, type, value }: ConfirmParams): Promise<boolean> {
        return distributedLock(log).runExclusive({
            key: `otp-confirm-${identityId}-${type}`,
            timeoutInSeconds: 15,
            fn: async () => {
                const otp = await repo().findOneBy({ identityId, type })
                if (isNil(otp)) {
                    return false
                }
                if (otp.attempts >= MAX_ATTEMPTS) {
                    await discard({ otp, identityId, type, log })
                    return false
                }
                const otpIsPending = otp.state === OtpState.PENDING
                const otpIsNotExpired = !otpIsExpired(otp)
                const otpMatches = otp.value === value
                if (otpIsNotExpired && otpMatches && otpIsPending) {
                    await repo().delete({ id: otp.id })
                    return true
                }
                await countAttempt(otp.id)
                if (otp.attempts + 1 >= MAX_ATTEMPTS) {
                    await discard({ otp, identityId, type, log })
                }
                return false
            },
        })
    },
})

async function countAttempt(otpId: string): Promise<void> {
    await repo().query('UPDATE "otp" SET "attempts" = "attempts" + 1 WHERE "id" = $1', [otpId])
}

async function discard({ otp, identityId, type, log }: DiscardParams): Promise<void> {
    await repo().delete({ id: otp.id })
    log.warn({ identityId, type }, '[otpService#confirm] attempt budget exhausted, credential discarded')
}

function otpIsExpired(otp: OtpModel): boolean {
    return dayjs().diff(otp.updated, 'milliseconds') >= OTP_EXPIRATION_MS[otp.type]
}

type CreateParams = {
    platformId: PlatformId | null
    email: string
    type: OtpType
}

type DiscardParams = {
    otp: OtpModel
    identityId: string
    type: OtpType
    log: FastifyBaseLogger
}

type ConfirmParams = {
    identityId: string
    type: OtpType
    value: string
}
