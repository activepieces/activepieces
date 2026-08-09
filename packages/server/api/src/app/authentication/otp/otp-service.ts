import { apId, isNil, PlatformId } from '@activepieces/core-utils'
import { OtpModel, OtpState, OtpType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { emailService } from '../../ee/helper/email/email-service'
import { userIdentityService } from '../user-identity/user-identity-service'
import { otpGenerator } from './lib/otp-generator'
import { OtpEntity } from './otp-entity'

const TEN_MINUTES = 10 * 60 * 1000
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
        const otpIsNotExpired = !isNil(existingOtp) && dayjs().diff(existingOtp.updated, 'milliseconds') < TEN_MINUTES
        if (otpIsNotExpired && existingOtp.state === OtpState.PENDING) {
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

    async confirm({ identityId, type, value }: ConfirmParams): Promise<boolean> {
        const otp = await spendAttempt({ identityId, type })
        if (isNil(otp)) {
            return false
        }
        const otpIsPending = otp.state === OtpState.PENDING
        const otpIsNotExpired = dayjs().diff(otp.updated, 'milliseconds') < TEN_MINUTES
        const otpMatches = otp.value === value
        const verdict = otpIsNotExpired && otpMatches && otpIsPending
        if (verdict) {
            return consumeOtp(otp.id)
        }
        if (otp.attempts >= MAX_ATTEMPTS) {
            await repo().delete({ id: otp.id })
            log.warn({ identityId, type }, '[otpService#confirm] attempt budget exhausted, credential discarded')
        }
        return false
    },
})

async function spendAttempt({ identityId, type }: SpendAttemptParams): Promise<SpentAttempt | null> {
    const rows: SpentAttempt[] = await repo().query(
        `UPDATE "otp" SET "attempts" = "attempts" + 1
         WHERE "identityId" = $1 AND "type" = $2 AND "attempts" < $3
         RETURNING "id", "value", "state", "updated", "attempts"`,
        [identityId, type, MAX_ATTEMPTS],
    )
    return rows[0] ?? null
}

async function consumeOtp(otpId: string): Promise<boolean> {
    const rows: { id: string }[] = await repo().query(
        'DELETE FROM "otp" WHERE "id" = $1 RETURNING "id"',
        [otpId],
    )
    return rows.length === 1
}

type CreateParams = {
    platformId: PlatformId | null
    email: string
    type: OtpType
}

type SpendAttemptParams = {
    identityId: string
    type: OtpType
}

type SpentAttempt = {
    id: string
    value: string
    state: OtpState
    updated: string
    attempts: number
}

type ConfirmParams = {
    identityId: string
    type: OtpType
    value: string
}
