import { SeekPage, User, UserId } from '@activepieces/shared'
import { PlatformId } from '@activepieces/ee-shared'
import { databaseConnection } from '../../database/database-connection'
import { UserEntity } from '../../user/user-entity'

const repo = databaseConnection.getRepository(UserEntity)

export const enterpriseUserService = {
    async list({ platformId }: ListParams): Promise<SeekPage<User>> {
        const users = await repo.findBy({
            platformId: platformId ?? undefined,
        })

        return {
            data: users,
            next: null,
            previous: null,
        }
    },

    async delete(id: UserId): Promise<void> {
        await repo.delete(id)
    },
}

type ListParams = {
    platformId: PlatformId | null
}
