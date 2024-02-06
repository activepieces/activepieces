import { apId, SignUpRequest, User, UserId, UserMeta, UserStatus, isNil, ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { passwordHasher } from '../authentication/lib/password-hasher'
import { databaseConnection } from '../database/database-connection'
import { UserEntity } from './user-entity'
import { PlatformId } from '@activepieces/shared'
import { IsNull } from 'typeorm'
import dayjs from 'dayjs'

const userRepo = databaseConnection.getRepository(UserEntity)

export const userService = {
    async create(params: CreateParams): Promise<User> {
        const hashedPassword = await passwordHasher.hash(params.password)

        const user: NewUser = {
            id: apId(),
            ...params,
            status: UserStatus.ACTIVE,
            password: hashedPassword,
        }

        return userRepo.save(user)
    },

    async verify({ id }: IdParams): Promise<User> {
        const user = await userRepo.findOneByOrFail({ id })
        if (user.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'User is already verified',
                },
            })
        }
        return userRepo.save({
            ...user,
            verified: true,
        })
    },

    async get({ id }: IdParams): Promise<User | null> {
        return userRepo.findOneBy({ id })
    },
    async getOneOrFail({ id }: IdParams): Promise<User> {
        return userRepo.findOneByOrFail({ id })
    },

    async getMetaInfo({ id }: IdParams): Promise<UserMeta | null> {
        const user = await this.get({ id })

        if (isNil(user)) {
            return null
        }

        return {
            id: user.id,
            email: user.email,
            platformId: user.platformId,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            title: user.title,
        }
    },

    async getByPlatformAndEmail({ platformId, email }: GetByPlatformAndEmailParams): Promise<User | null> {
        const platformWhereQuery = platformId ? { platformId } : { platformId: IsNull() }

        return userRepo.createQueryBuilder()
            .where(platformWhereQuery)
            .andWhere('LOWER(email) = LOWER(:email)', { email })
            .getOne()
    },

    async getByPlatformAndExternalId({ platformId, externalId }: GetByPlatformAndExternalIdParams): Promise<User | null> {
        return userRepo.findOneBy({
            platformId,
            externalId,
        })
    },

    async updatePassword({ id, newPassword }: UpdatePasswordParams): Promise<void> {
        const hashedPassword = await passwordHasher.hash(newPassword)

        await userRepo.update(id, {
            updated: dayjs().toISOString(),
            password: hashedPassword,
        })
    },

    async updatePlatformId({ id, platformId }: UpdatePlatformIdParams): Promise<void> {
        await userRepo.update(id, {
            updated: dayjs().toISOString(),
            platformId,
        })
    },
}

type CreateParams = SignUpRequest & {
    verified: boolean
    platformId: PlatformId | null
    externalId?: string
}

type NewUser = Omit<User, 'created' | 'updated'>

type GetByPlatformAndEmailParams = {
    platformId: PlatformId | null
    email: string
}

type GetByPlatformAndExternalIdParams = {
    platformId: PlatformId
    externalId: string
}

type IdParams = {
    id: UserId
}

type UpdatePasswordParams = {
    id: UserId
    newPassword: string
}

type UpdatePlatformIdParams = {
    id: UserId
    platformId: PlatformId
}
