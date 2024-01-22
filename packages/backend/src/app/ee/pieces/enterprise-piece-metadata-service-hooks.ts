import { FilteredPieceBehavior, isNil } from '@activepieces/shared'
import { PieceMetadataModelSummary } from '../../pieces/piece-metadata-entity'
import { PieceMetadataServiceHooks } from '../../pieces/piece-metadata-service/hooks'
import { platformService } from '../../platform/platform.service'

export const enterprisePieceMetadataServiceHooks: PieceMetadataServiceHooks = {
    async filterPieces({ pieces, platformId, includeHidden }) {
        if (isNil(platformId) || includeHidden) {
            return pieces
        }

        const platform = await platformService.getOneOrThrow(platformId)

        const filterPredicate: Record<FilteredPieceBehavior, (p: PieceMetadataModelSummary) => boolean> = {
            [FilteredPieceBehavior.ALLOWED]: p => platform.filteredPieceNames.includes(p.name),
            [FilteredPieceBehavior.BLOCKED]: p => !platform.filteredPieceNames.includes(p.name),
        }

        const predicate = filterPredicate[platform.filteredPieceBehavior]

        return pieces
            .slice()
            .filter(predicate)
    },
}
