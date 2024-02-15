import { PieceMetadataSchema } from '../../piece-metadata-entity'
import { PlatformId } from '@activepieces/ee-shared'
import { PieceSortBy, PieceOrderBy, PieceCategory } from '@activepieces/shared'
import { filterPiecesBasedUser } from './piece-filtering'
import { sortAndOrderPieces } from './piece-sorting'

export const defaultPieceHooks: PieceMetadataServiceHooks = {
    async filterPieces(params) {
        return sortAndOrderPieces(
            params.sortBy,
            params.orderBy,
            filterPiecesBasedUser({
                categories: params.categories,
                searchQuery: params.searchQuery,
                pieces: params.pieces,
            }),
        )
    },
}

let hooks = defaultPieceHooks

export const pieceMetadataServiceHooks = {
    set(newHooks: PieceMetadataServiceHooks): void {
        hooks = newHooks
    },

    get(): PieceMetadataServiceHooks {
        return hooks
    },
}

export type PieceMetadataServiceHooks = {
    filterPieces(p: FilterPiecesParams): Promise<PieceMetadataSchema[]>
}

export type FilterPiecesParams = {
    includeHidden?: boolean
    platformId?: PlatformId
    searchQuery?: string
    categories?: PieceCategory[]
    sortBy?: PieceSortBy
    orderBy?: PieceOrderBy
    pieces: PieceMetadataSchema[]
}
