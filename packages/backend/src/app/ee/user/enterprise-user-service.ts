import { ActivepiecesError, ErrorCode, SeekPage, User, UserId } from '@activepieces/shared'
import { PlatformId } from '@activepieces/ee-shared'
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

    async delete({ id, platformId }: DeleteParams): Promise<void> {
        const deleteResult = await repo.delete({
            id,
            platformId,
        })

        if (deleteResult.affected !== 1) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: id,
                },
            })
        }
    },
}

type ListParams = {
    platformId: PlatformId
}

type DeleteParams = {
    id: UserId
    platformId: PlatformId
}
