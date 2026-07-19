import { isAudienceVisible, PieceAudienceFilter, PieceCategory, PieceOrderBy, PieceSortBy, SuggestionType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PieceMetadataSchema } from '../piece-metadata-entity'
import { pieceSearching } from './piece-searching'
import { pieceSorting } from './piece-sorting'

export const pieceListUtils = (_log: FastifyBaseLogger) => ({
    async sortAndSearchPieces(params: SortAndSearchPiecesParams): Promise<PieceMetadataSchema[]> {
        const sortedPieces = pieceSorting.sortAndOrder(
            params.sortBy,
            params.orderBy,
            params.pieces,
        )

        return pieceSearching.search({
            categories: params.categories,
            searchQuery: params.searchQuery,
            pieces: sortedPieces,
            suggestionType: params.suggestionType,
        })
    },
})

export function filterActionsByAudience<T extends { audience?: string }>(
    actions: Record<string, T>,
    audience: PieceAudienceFilter,
): Record<string, T> {
    return Object.fromEntries(
        Object.entries(actions).filter(([, action]) => isAudienceVisible(action.audience, audience)),
    )
}

export type SortAndSearchPiecesParams = {
    searchQuery?: string
    categories?: PieceCategory[]
    sortBy?: PieceSortBy
    orderBy?: PieceOrderBy
    pieces: PieceMetadataSchema[]
    suggestionType?: SuggestionType
}

export * from './piece-cache-utils'
