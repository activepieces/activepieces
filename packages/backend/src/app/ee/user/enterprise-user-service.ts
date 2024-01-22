import { ActivepiecesError, ErrorCode, PlatformId, SeekPage, User, UserId, UserStatus } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { UserEntity } from '../../user/user-entity'

const repo = databaseConnection.getRepository(UserEntity)

export const enterpriseUserService = {
    async list({ platformId }: ListParams): Promise<SeekPage<User>> {
        const users = await repo.findBy({
            platformId,
        })

        return {
            data: users,
            next: null,
            previous: null,
        }
    },

    async update({ id, status, platformId }: UpdateParams): Promise<User> {
        const updateResult = await repo.update({
            id,
            platformId,
        }, {
            status,
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
        return repo.findOneByOrFail({
            id,
            platformId,
        })
    },
}

type ListParams = {
    platformId: PlatformId
}

type UpdateParams = {
    id: UserId
    status: UserStatus
    platformId: PlatformId
}
