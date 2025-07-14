import { PieceCategory, PieceOrderBy, PieceSortBy, PlatformId, SuggestionType } from '@activepieces/shared'
import { enterpriseFilteringUtils } from '../../../ee/pieces/filters/piece-filtering-utils'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import { pieceSearching } from './piece-searching'
import { pieceSorting } from './piece-sorting'

export const pieceListUtils = {
    async filterPieces(params: FilterPiecesParams): Promise<PieceMetadataSchema[]> {
        const sortedPieces = pieceSorting.sortAndOrder(
            params.sortBy,
            params.orderBy,
            params.pieces,
        )

        const userBasedPieces = pieceSearching.search({
            categories: params.categories,
            searchQuery: params.searchQuery,
            pieces: sortedPieces,
            suggestionType: params.suggestionType,
        })

        return enterpriseFilteringUtils.filter({
            pieces: userBasedPieces,
            includeHidden: params.includeHidden,
            platformId: params.platformId,
            projectId: params.projectId,
        })
    },
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
