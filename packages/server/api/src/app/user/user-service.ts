import {
    ActivepiecesError,
    apId,
    ErrorCode,
    isNil,
    PlatformId,
    PlatformRole,
    SeekPage,
    SignUpRequest,
    spreadIfDefined,
    User,
    UserId,
    UserMeta,
    UserStatus,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import { IsNull } from 'typeorm'
import { passwordHasher } from '../authentication/lib/password-hasher'
import { repoFactory } from '../core/db/repo-factory'
import { UserEntity } from './user-entity'


export const userRepo = repoFactory(UserEntity)

export const userService = {
    async create(params: CreateParams): Promise<User> {
        const hashedPassword = await passwordHasher.hash(params.password)

        const user: NewUser = {
            id: apId(),
            ...params,
            email: params.email.toLowerCase().trim(),
            platformRole: params.platformRole,
            status: UserStatus.ACTIVE,
            password: hashedPassword,
            tokenVersion: nanoid(),
        }

        return userRepo().save(user)
    },
    async update({ id, status, platformId, platformRole, externalId }: UpdateParams): Promise<User> {

        const updateResult = await userRepo().update({
            id,
            platformId,
        }, {
            ...spreadIfDefined('status', status),
            ...spreadIfDefined('platformRole', platformRole),
            ...spreadIfDefined('externalId', externalId),
        })

        if (updateResult.affected !== 1) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: id,
                },
            })
        }
        return userRepo().findOneByOrFail({
            id,
            platformId,
        })
    },
    async list({ platformId }: ListParams): Promise<SeekPage<User>> {
        const users = await userRepo().findBy({
            platformId,
        })

        return {
            data: users,
            next: null,
            previous: null,
        }
    },

    async verify({ id }: IdParams): Promise<User> {
        const user = await userRepo().findOneByOrFail({ id })
        if (user.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'User is already verified',
                },
            })
        }
        return userRepo().save({
            ...user,
            verified: true,
        })
    },

    async get({ id }: IdParams): Promise<User | null> {
        return userRepo().findOneBy({ id })
    },
    async getOneOrFail({ id }: IdParams): Promise<User> {
        return userRepo().findOneByOrFail({ id })
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
            platformRole: user.platformRole,
            lastName: user.lastName,
        }
    },

    async delete({ id, platformId }: DeleteParams): Promise<void> {
        await userRepo().delete({
            id,
            platformId,
        })
    },

    async getUsersByEmail({ email }: { email: string }): Promise<User[]> {
        return userRepo()
            .createQueryBuilder()
            .andWhere('LOWER(email) = LOWER(:email)', { email })
            .getMany()
    },
    async getByPlatformAndEmail({
        platformId,
        email,
    }: GetByPlatformAndEmailParams): Promise<User | null> {
        const platformWhereQuery = platformId
            ? { platformId }
            : { platformId: IsNull() }

        return userRepo()
            .createQueryBuilder()
            .where(platformWhereQuery)
            .andWhere('LOWER(email) = LOWER(:email)', { email })
            .getOne()
    },

    async getByPlatformAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformAndExternalIdParams): Promise<User | null> {
        return userRepo().findOneBy({
            platformId,
            externalId,
        })
    },

    async updatePassword({
        id,
        newPassword,
    }: UpdatePasswordParams): Promise<void> {
        const hashedPassword = await passwordHasher.hash(newPassword)

        await userRepo().update(id, {
            updated: dayjs().toISOString(),
            password: hashedPassword,
            tokenVersion: nanoid(),
        })
    },

    async addOwnerToPlatform({
        id,
        platformId,
    }: UpdatePlatformIdParams): Promise<void> {
        await userRepo().update(id, {
            updated: dayjs().toISOString(),
            platformRole: PlatformRole.ADMIN,
            platformId,
        })
    },
}

type DeleteParams = {
    id: UserId
    platformId: PlatformId
}


type ListParams = {
    platformId: PlatformId
}


type UpdateParams = {
    id: UserId
    status?: UserStatus
    platformId: PlatformId
    platformRole?: PlatformRole
    externalId?: string
}

type CreateParams = SignUpRequest & {
    verified: boolean
    platformId: string | null
    externalId?: string
    platformRole: PlatformRole
}

type NewUser = Omit<User, 'created' | 'updated'>

type GetByPlatformAndEmailParams = {
    platformId: string | null
    email: string
}

type GetByPlatformAndExternalIdParams = {
    platformId: string
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
    platformId: string
}
