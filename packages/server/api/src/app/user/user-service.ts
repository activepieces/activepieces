import {
    ActivepiecesError,
    apId,
    ErrorCode,
    PlatformId,
    PlatformRole,
    SeekPage,
    spreadIfDefined,
    User,
    UserId,
    UserStatus,
    UserWithMetaInformation,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { UserEntity } from './user-entity'


export const userRepo = repoFactory(UserEntity)

export const userService = {
    async create(params: CreateParams): Promise<User> {
        const user: NewUser = {
            id: apId(),
            identityId: params.identityId,
            platformRole: params.platformRole,
            status: UserStatus.ACTIVE,
            externalId: params.externalId,
            platformId: params.platformId,
        }
        return userRepo().save(user)
    },
    async update({ id, status, platformId, platformRole, externalId }: UpdateParams): Promise<UserWithMetaInformation> {

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
        return this.getMetaInformation({ id })
    },
    async list({ platformId }: ListParams): Promise<SeekPage<UserWithMetaInformation>> {
        const users = await userRepo().findBy({
            platformId,
        })

        return {
            data: await Promise.all(users.map(this.getMetaInformation)),
            next: null,
            previous: null,
        }
    },
    async getOneByIdentityIdOnly({ identityId }: GetOneByIdentityIdOnlyParams): Promise<User | null> {
        return userRepo().findOneBy({ identityId })
    },
    async getOneByIdentityAndPlatform({ identityId, platformId }: GetOneByIdentityIdParams): Promise<User | null> {
        return userRepo().findOneBy({ identityId, platformId })
    },
    async get({ id }: IdParams): Promise<User | null> {
        return userRepo().findOneBy({ id })
    },
    async getOneOrFail({ id }: IdParams): Promise<User> {
        return userRepo().findOneByOrFail({ id })
    },
    async delete({ id, platformId }: DeleteParams): Promise<void> {
        await userRepo().delete({
            id,
            platformId,
        })
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
    async getMetaInformation({ id }: IdParams): Promise<UserWithMetaInformation> {
        const user = await userRepo().findOneByOrFail({ id })
        const identity = await userIdentityService(system.globalLogger()).getBasicInformation(user.identityId)
        return {
            id: user.id,
            email: identity.email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
        }
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

type GetOneByIdentityIdOnlyParams = {
    identityId: string
}

type GetOneByIdentityIdParams = {
    identityId: string
    platformId: PlatformId
}

type UpdateParams = {
    id: UserId
    status?: UserStatus
    platformId: PlatformId
    platformRole?: PlatformRole
    externalId?: string
}

type CreateParams = {
    identityId: string
    platformId: string | null
    externalId?: string
    platformRole: PlatformRole
}

type NewUser = Omit<User, 'created' | 'updated'>

type GetByPlatformAndExternalIdParams = {
    platformId: string
    externalId: string
}

type IdParams = {
    id: UserId
}

type UpdatePlatformIdParams = {
    id: UserId
    platformId: string
}
