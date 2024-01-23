import { PieceMetadataModelSummary } from '../piece-metadata-entity'
import { PlatformId } from '@activepieces/ee-shared'

const defaultHooks: PieceMetadataServiceHooks = {
    async filterPieces({ pieces }) {
        return pieces
    },
}

let hooks = defaultHooks

export const pieceMetadataServiceHooks = {
    set(newHooks: PieceMetadataServiceHooks): void {
        hooks = newHooks
    },

    get(): PieceMetadataServiceHooks {
        return hooks
    },
}

export type PieceMetadataServiceHooks = {
    filterPieces(p: FilterPiecesParams): Promise<PieceMetadataModelSummary[]>
}

export type FilterPiecesParams = {
    includeHidden?: boolean
    pieces: PieceMetadataModelSummary[]
    platformId?: PlatformId
}
