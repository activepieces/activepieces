import {
    OtpModel,
    OtpState,
    OtpType,
} from '@activepieces/ee-shared'
import { apId, PlatformId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { emailService } from '../../helper/email/email-service'
import { otpGenerator } from './lib/otp-generator'
import { OtpEntity } from './otp-entity'

const TEN_MINUTES = 10 * 60 * 1000

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
        const otpIsNotExpired = existingOtp && dayjs().diff(existingOtp.updated, 'milliseconds') < TEN_MINUTES
        if (otpIsNotExpired) {
            return
        }
        const newOtp: Omit<OtpModel, 'created'> = {
            id: apId(),
            updated: dayjs().toISOString(),
            type,
            identityId: userIdentity.id,
            value: otpGenerator.generate(),
            state: OtpState.PENDING,
        }
        await repo().upsert(newOtp, ['identityId', 'type'])
        await emailService(log).sendOtp({
            platformId,
            userIdentity,
            otp: newOtp.value,
            type: newOtp.type,
        })
    },

    async confirm({ identityId, type, value }: ConfirmParams): Promise<boolean> {
        const otp = await repo().findOneByOrFail({
            identityId,
            type,
        })
        const otpIsPending = otp.state === OtpState.PENDING
        const otpIsNotExpired = dayjs().diff(otp.updated, 'milliseconds') < TEN_MINUTES
        const otpMatches = otp.value === value
        const verdict = otpIsNotExpired && otpMatches && otpIsPending
        if (verdict) {
            await repo().update(otp.id, {
                state: OtpState.CONFIRMED,
            })
        }

        return verdict
    },
})

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
