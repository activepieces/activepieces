import dayjs from 'dayjs'
import { IsNull } from 'typeorm'
import { passwordHasher } from '../authentication/lib/password-hasher'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { projectMemberService } from '../ee/project-members/project-member.service'
import { getEdition } from '../helper/secret-helper'
import { UserEntity } from './user-entity'
import {
    ActivepiecesError,
    ApEdition,
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


const repo = repoFactory(UserEntity)

export const userService = {
    async create(params: CreateParams): Promise<User> {
        const hashedPassword = await passwordHasher.hash(params.password)

        const user: NewUser = {
            id: apId(),
            ...params,
            platformRole: params.platformRole,
            status: UserStatus.ACTIVE,
            password: hashedPassword,
        }

        return repo().save(user)
    },
    async update({ id, status, platformId, platformRole }: UpdateParams): Promise<User> {
        const updateResult = await repo().update({
            id,
            platformId,
        },
        {
            ...spreadIfDefined('status', status),
            ...spreadIfDefined('platformRole', platformRole),
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
        return repo().findOneByOrFail({
            id,
            platformId,
        })
    },
    async list({ platformId }: ListParams): Promise<SeekPage<User>> {
        const users = await repo().findBy({
            platformId,
        })

        return {
            data: users,
            next: null,
            previous: null,
        }
    },

    async verify({ id }: IdParams): Promise<User> {
        const user = await repo().findOneByOrFail({ id })
        if (user.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'User is already verified',
                },
            })
        }
        return repo().save({
            ...user,
            verified: true,
        })
    },

    async get({ id }: IdParams): Promise<User | null> {
        return repo().findOneBy({ id })
    },
    async getOneOrFail({ id }: IdParams): Promise<User> {
        return repo().findOneByOrFail({ id })
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
        return transaction(async (entityManager) => {
            const user = await repo(entityManager).findOneByOrFail({
                id,
                platformId,
            })

            const edition = getEdition()
            if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
                await projectMemberService.deleteAllByPlatformAndEmail({
                    email: user.email,
                    platformId,
                    entityManager,
                })
            }

            await repo(entityManager).delete({
                id,
                platformId,
            })
        })
    },

    async getUsersByEmail({ email }: { email: string }): Promise<User[]> {
        return repo()
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

        return repo()
            .createQueryBuilder()
            .where(platformWhereQuery)
            .andWhere('LOWER(email) = LOWER(:email)', { email })
            .getOne()
    },

    async getByPlatformAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformAndExternalIdParams): Promise<User | null> {
        return repo().findOneBy({
            platformId,
            externalId,
        })
    },

    async updatePassword({
        id,
        newPassword,
    }: UpdatePasswordParams): Promise<void> {
        const hashedPassword = await passwordHasher.hash(newPassword)

        await repo().update(id, {
            updated: dayjs().toISOString(),
            password: hashedPassword,
        })
    },

    async addOwnerToPlatform({
        id,
        platformId,
    }: UpdatePlatformIdParams): Promise<void> {
        await repo().update(id, {
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
