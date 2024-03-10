import {
    ActivepiecesError,
    ErrorCode,
    PlatformId,
    SeekPage,
    User,
    UserId,
    UserStatus,
} from '@activepieces/shared'
import { UserEntity } from '../../user/user-entity'
import { repoFactory } from '../../core/db/repo-factory'
import { EntityManager } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { projectMemberService } from '../project-members/project-member.service'

const repo = repoFactory(UserEntity)

export const enterpriseUserService = {
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

    async update({ id, status, platformId }: UpdateParams): Promise<User> {
        const updateResult = await repo().update(
            {
                id,
                platformId,
            },
            {
                status,
            },
        )
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

    async delete({ id, platformId }: DeleteParams): Promise<void> {
        return transaction(async (entityManager) => {
            const user = await getUserOrThrow({
                id,
                platformId,
                entityManager,
            })

            await projectMemberService.deleteAllByPlatformAndEmail({
                email: user.email,
                platformId,
                entityManager,
            })

            await repo(entityManager).delete({
                id,
                platformId,
            })
        })
    },
}

const getUserOrThrow = async ({ id, platformId, entityManager }: GetUserOrThrowParams): Promise<User> => {
    const user = await repo(entityManager).findOneBy({
        id,
        platformId,
    })

    if (!user) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'user',
                entityId: id,
            },
        })
    }

    return user

}

type ListParams = {
    platformId: PlatformId
}

type UpdateParams = {
    id: UserId
    status: UserStatus
    platformId: PlatformId
}

type DeleteParams = {
    id: UserId
    platformId: PlatformId
}

type GetUserOrThrowParams = {
    id: UserId
    platformId: PlatformId
    entityManager?: EntityManager
}
