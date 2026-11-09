import { FastifyBaseLogger } from 'fastify'
import { PieceCatalogHooks, PieceSetVisibility } from '../../../pieces/piece-catalog/piece-catalog-hooks'
import { pieceSetRepo } from './piece-set.service'

export const pieceSetCatalogHooks = (_log: FastifyBaseLogger): PieceCatalogHooks => ({
    async listPieceSets({ platformId }): Promise<PieceSetVisibility[]> {
        const pieceSets = await pieceSetRepo().find({
            where: { platformId },
            select: { id: true, key: true, name: true, isDefault: true, config: true },
            order: { created: 'ASC' },
        })
        return pieceSets.map((pieceSet) => ({
            id: pieceSet.id,
            key: pieceSet.key ?? null,
            name: pieceSet.name,
            isDefault: pieceSet.isDefault,
            pieces: pieceSet.config.pieces,
        }))
    },
})
