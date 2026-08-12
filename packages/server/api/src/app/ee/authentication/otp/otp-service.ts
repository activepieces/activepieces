import { apId, PlatformId } from '@activepieces/core-utils'
import { OtpModel, OtpState, OtpType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { emailService } from '../../helper/email/email-service'
import { otpGenerator } from './lib/otp-generator'
import { OtpEntity } from './otp-entity'

const OTP_EXPIRATION_MS: Record<OtpType, number> = {
    [OtpType.EMAIL_VERIFICATION]: 24 * 60 * 60 * 1000,
    [OtpType.PASSWORD_RESET]: 10 * 60 * 1000,
}

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
        const existingOtpIsReusable = existingOtp && existingOtp.state === OtpState.PENDING && !otpIsExpired(existingOtp)
        const otp: Omit<OtpModel, 'created'> = {
            id: existingOtp?.id ?? apId(),
            updated: dayjs().toISOString(),
            type,
            identityId: userIdentity.id,
            value: existingOtpIsReusable ? existingOtp.value : otpGenerator.generate(),
            state: OtpState.PENDING,
        }
        await repo().upsert(otp, ['identityId', 'type'])
        await emailService(log).sendOtp({
            platformId,
            userIdentity,
            otp: otp.value,
            type: otp.type,
        })
    },

    async confirm({ identityId, type, value }: ConfirmParams): Promise<boolean> {
        const otp = await repo().findOneByOrFail({
            identityId,
            type,
        })
        const otpIsPending = otp.state === OtpState.PENDING
        const otpMatches = otp.value === value
        const verdict = !otpIsExpired(otp) && otpMatches && otpIsPending
        if (verdict) {
            await repo().update(otp.id, {
                state: OtpState.CONFIRMED,
            })
        }

        return verdict
    },
})

function otpIsExpired(otp: OtpModel): boolean {
    return dayjs().diff(otp.updated, 'milliseconds') >= OTP_EXPIRATION_MS[otp.type]
}

type CreateParams = {
    platformId: PlatformId | null
    email: string
    type: OtpType
}

type ConfirmParams = {
    identityId: string
    type: OtpType
    value: string
}
