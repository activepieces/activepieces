import dayjs from 'dayjs'
import { databaseConnection } from '../../database/database-connection'
import { userService } from '../../user/user-service'
import { emailService } from '../helper/email/email-service'
import { otpGenerator } from './lib/otp-generator'
import { OtpEntity } from './otp-entity'
import {
    OtpModel,
    OtpState,
    OtpType,
} from '@activepieces/ee-shared'
import { apId, PlatformId, User, UserId } from '@activepieces/shared'

const TEN_MINUTES = 10 * 60 * 1000

const repo = databaseConnection.getRepository(OtpEntity)

export const otpService = {
    async createAndSend({
        platformId,
        email,
        type,
    }: CreateParams): Promise<void> {
        const user = await getUser({
            platformId,
            email,
        })
        if (user) {
            const newOtp: Omit<OtpModel, 'created'> = {
                id: apId(),
                updated: dayjs().toISOString(),
                type,
                userId: user.id,
                value: otpGenerator.generate(),
                state: OtpState.PENDING,
            }
            await repo.upsert(newOtp, ['userId', 'type'])
            await emailService.sendOtp({
                platformId,
                user,
                otp: newOtp.value,
                type: newOtp.type,
            })
        }
    },

    async confirm({ userId, type, value }: ConfirmParams): Promise<boolean> {
        const otp = await repo.findOneByOrFail({
            userId,
            type,
        })
        const now = dayjs()
        const otpIsPending = otp.state === OtpState.PENDING
        const otpIsNotExpired =
      now.diff(otp.updated, 'milliseconds') < TEN_MINUTES
        const otpMatches = otp.value === value
        const verdict = otpIsNotExpired && otpMatches && otpIsPending
        if (verdict) {
            await repo.update(otp.id, {
                state: OtpState.CONFIRMED,
            })
        }

        return verdict
    },
}

const getUser = async ({
    platformId,
    email,
}: GetUserOrThrowParams): Promise<User | null> => {
    const user = await userService.getByPlatformAndEmail({
        platformId,
        email,
    })

    return user
}

type CreateParams = {
    platformId: PlatformId 
    email: string
    type: OtpType
}

type ConfirmParams = {
    userId: UserId
    type: OtpType
    value: string
}

type GetUserOrThrowParams = {
    platformId: PlatformId | null
    email: string
}
