import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { PlatformEntity } from './platform.entity'
import { Platform, UpdatePlaformRequest } from '@activepieces/ee-shared'

const platformRepo = databaseConnection.getRepository<Platform>(PlatformEntity)

export const platformService = {
    async update(request: { platformId: string, request: UpdatePlaformRequest }): Promise<Platform> {
        const platform = await platformRepo.findOneBy({
            id: request.platformId,
        })
        if (isNil(platform)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Platform ${request.platformId} not found`,
                },
            })
        }
        // TODO UPDATE
        return platform
    },
    async getOrThrow({ id }: { id: string }) {
        const platform = await platformRepo.findOneBy({
            id,
        })
        if (isNil(platform)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Platform ${id} not found`,
                },
            })
        }
        return platform
    },
}
