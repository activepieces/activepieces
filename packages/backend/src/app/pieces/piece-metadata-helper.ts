import { PieceBase, PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { PieceMetadataSchema } from './piece-metadata-entity'
const toPieceBase = (pieceMetadataEntity: PieceMetadataSchema): PieceBase => {
    const {
        id: _id,
        created: _created,
        updated: _updated,
        actions: _actions,
        triggers: _triggers,
        ...pieceBase
    } = pieceMetadataEntity

    return pieceBase
}
const toPieceMetadataSummary = (pieceMetadataEntityList: PieceMetadataSchema[]): PieceMetadataSummary[] => {
    return pieceMetadataEntityList.map(pieceMetadataEntity => {
        const pieceBase = toPieceBase(pieceMetadataEntity)

        return {
            ...pieceBase,
            actions: Object.keys(pieceMetadataEntity.actions).length,
            triggers: Object.keys(pieceMetadataEntity.triggers).length,
        }
    })
}
const toPieceMetadata = (pieceMetadataEntity: PieceMetadataSchema): PieceMetadata => {
    const pieceBase = toPieceBase(pieceMetadataEntity)

    return {
        ...pieceBase,
        actions: pieceMetadataEntity.actions,
        triggers: pieceMetadataEntity.triggers,
    }
}

export const pieceMetadataHelper = {
    toPieceMetadataSummary,
    toPieceMetadata,
    toPieceBase,
}