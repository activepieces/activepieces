import { groupBy, PlatformId } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { PieceCatalogHooks, PieceSetVisibility } from '../../../pieces/piece-catalog/piece-catalog-hooks'
import { pieceSetRepo } from './piece-set.service'

export const pieceSetCatalogHooks = (_log: FastifyBaseLogger): PieceCatalogHooks => ({
    async listPieceSets({ platformIds }): Promise<Map<PlatformId, PieceSetVisibility[]>> {
        if (platformIds.length === 0) {
            return new Map()
        }
        const pieceSets = await pieceSetRepo().find({
            where: { platformId: In(platformIds) },
            select: { id: true, platformId: true, key: true, name: true, isDefault: true, config: true },
            order: { created: 'ASC' },
        })
        const byPlatform = groupBy(pieceSets, (pieceSet) => pieceSet.platformId)
        return new Map(Object.entries(byPlatform).map(([platformId, platformPieceSets]) => [platformId, platformPieceSets.map((pieceSet) => ({
            id: pieceSet.id,
            key: pieceSet.key ?? null,
            name: pieceSet.name,
            isDefault: pieceSet.isDefault,
            pieces: pieceSet.config.pieces,
        }))]))
    },
})
