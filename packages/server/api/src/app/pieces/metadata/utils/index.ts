import { FilteredPieceBehavior, isNil, PieceCategory, PieceOrderBy, PieceSortBy, PlatformId, SuggestionType } from '@activepieces/shared'
import { platformService } from '../../../platform/platform.service'
import { PieceMetadataSchema } from '../piece-metadata-entity'
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

        // Apply platform-level piece filtering
        if (isNil(params.platformId) || params.includeHidden) {
            return userBasedPieces
        }

        const platform = await platformService.getOneOrThrow(params.platformId)
        const { filteredPieceNames, filteredPieceBehavior } = platform

        if (isNil(filteredPieceNames) || filteredPieceNames.length === 0) {
            return userBasedPieces
        }

        return userBasedPieces.filter((piece) => {
            const isInFilteredList = filteredPieceNames.includes(piece.name)
            if (filteredPieceBehavior === FilteredPieceBehavior.BLOCKED) {
                // BLOCKED: hide pieces in the list
                return !isInFilteredList
            }
            // ALLOWED: only show pieces in the list
            return isInFilteredList
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
