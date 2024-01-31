import { FilteredPieceBehavior } from '@activepieces/ee-shared'
import { isNil } from '@activepieces/shared'
import { PieceMetadataServiceHooks, filterPieceBasedOnSearchQuery } from '../../pieces/piece-metadata-service/hooks'
import { platformService } from '../platform/platform.service'
import { PieceMetadataModel } from '../../pieces/piece-metadata-entity'

export const enterprisePieceMetadataServiceHooks: PieceMetadataServiceHooks = {
    async filterPieces({ pieces, platformId, searchQuery, includeHidden }) {
        if (isNil(platformId) || includeHidden) {
            return pieces
        }

        const platform = await platformService.getOneOrThrow(platformId)

        const filterPredicate: Record<FilteredPieceBehavior, (p: PieceMetadataModel) => boolean> = {
            [FilteredPieceBehavior.ALLOWED]: p => platform.filteredPieceNames.includes(p.name),
            [FilteredPieceBehavior.BLOCKED]: p => !platform.filteredPieceNames.includes(p.name),
        }

        const predicate = filterPredicate[platform.filteredPieceBehavior]
        const resultPieces = pieces
            .slice()
            .filter(predicate)
        return filterPieceBasedOnSearchQuery({ pieces: resultPieces, searchQuery })
    },
}
