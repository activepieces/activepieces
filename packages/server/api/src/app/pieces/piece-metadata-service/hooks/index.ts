import { PieceMetadataSchema } from '../../piece-metadata-entity'
import { filterPiecesBasedOnPremiumPlatform, filterPiecesBasedUser } from './piece-filtering'
import { sortAndOrderPieces } from './piece-sorting'
import { PieceCategory, PieceOrderBy, PieceSortBy, PlatformId, SuggestionType } from '@activepieces/shared'

export const defaultPieceHooks: PieceMetadataServiceHooks = {
    async filterPieces(params) {
        const sortedPieces = sortAndOrderPieces(
            params.sortBy,
            params.orderBy,
            params.pieces,
        )
        
        const userBasedPieces = await filterPiecesBasedUser({
            categories: params.categories,
            searchQuery: params.searchQuery,
            pieces: sortedPieces,
            platformId: params.platformId,
            suggestionType: params.suggestionType,
        })

        const platformPremiumBasedPieces = filterPiecesBasedOnPremiumPlatform({
            platformId: params.platformId,
            pieces: userBasedPieces,
        })

        return platformPremiumBasedPieces
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
    projectId?: string
    sortBy?: PieceSortBy
    orderBy?: PieceOrderBy
    pieces: PieceMetadataSchema[]
    suggestionType?: SuggestionType
}
