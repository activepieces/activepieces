import { ActionBase } from '@activepieces/pieces-framework'
import { PieceAudienceFilter, PieceCategory, PieceOrderBy, PieceSortBy, SuggestionType } from '@activepieces/shared'
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

export function filterActionsByAudience(
    actions: Record<string, ActionBase>,
    audience: PieceAudienceFilter,
): Record<string, ActionBase> {
    return Object.fromEntries(
        Object.entries(actions).filter(([, action]) => {
            if (audience === PieceAudienceFilter.ALL) {
                return true
            }
            if (audience === PieceAudienceFilter.AI) {
                return action.audience !== 'human'
            }
            return action.audience !== 'ai'
        }),
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
