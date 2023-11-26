import { OtpModel, OtpType, PlatformId } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, User, UserId, apId, isNil } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { OtpEntity } from './otp-entity'
import dayjs from 'dayjs'
import { otpGenerator } from './lib/otp-generator'
import { emailService } from '../helper/email/email-service'
import { userService } from '../../user/user-service'

const TEN_MINUTES = 10 * 60 * 1000

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
            value: await otpGenerator.generate(),
        }

        const upsertResult = await repo.upsert(newOtp, ['userId', 'type'])

        await emailService.sendVerifyEmail({
            platformId,
            userId: user.id,
            email,
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
        const otpIsNotExpired = dayjs(otp.created).add(TEN_MINUTES).isBefore(now)
        const otpMatches = otp.value === value

        return otpIsNotExpired && otpMatches
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
