import { OtpModel, OtpState, OtpType, PlatformId } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, User, UserId, apId, isNil } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { OtpEntity } from './otp-entity'
import dayjs from 'dayjs'
import { otpGenerator } from './lib/otp-generator'
import { emailService } from '../helper/email/email-service'
import { userService } from '../../user/user-service'

const THIRTY_MINUTES = 30 * 60 * 1000

const repo = databaseConnection.getRepository(OtpEntity)

export const otpService = {
    async createAndSend({ platformId, email, type }: CreateParams): Promise<OtpModel> {
        const user = await getUserOrThrow({
            platformId,
            email,
        })

        const newOtp: Omit<OtpModel, 'created'> = {
            id: apId(),
            updated: dayjs().toISOString(),
            type,
            userId: user.id,
            value: otpGenerator.generate(),
            state: OtpState.PENDING,
        }

        const upsertResult = await repo.upsert(newOtp, ['userId', 'type'])

        await emailService.sendOtpEmail({
            platformId,
            user,
            otp: newOtp.value,
            type: newOtp.type,
        })

        return {
            ...newOtp,
            created: upsertResult.generatedMaps[0].created,
        }
    },

    async confirm({ userId, type, value }: ConfirmParams): Promise<boolean> {
        const otp = await repo.findOneByOrFail({
            userId,
            type,
        })

        const now = dayjs()
        const otpIsPending = otp.state === OtpState.PENDING
        const otpIsNotExpired = now.diff(otp.updated, 'milliseconds') < THIRTY_MINUTES
        const otpMatches = otp.value === value

        const verdict = otpIsPending && otpIsNotExpired && otpMatches

        if (verdict) {
            await repo.update(otp.id, {
                state: OtpState.CONFIRMED,
            })
        }

        return verdict
    },
}

const getUserOrThrow = async ({ platformId, email }: GetUserOrThrowParams): Promise<User> => {
    const user = await userService.getByPlatformAndEmail({
        platformId,
        email,
    })

    if (isNil(user)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'user',
                entityId: email,
            },
        })
    }

    return user
}

type CreateParams = {
    platformId: PlatformId | null
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
