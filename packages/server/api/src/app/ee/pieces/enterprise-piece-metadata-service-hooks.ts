import { FilteredPieceBehavior, isNil } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../pieces/piece-metadata-entity'
import {
    PieceMetadataServiceHooks,
    defaultPieceHooks,
} from '../../pieces/piece-metadata-service/hooks'
import { platformService } from '../../platform/platform.service'

export const enterprisePieceMetadataServiceHooks: PieceMetadataServiceHooks = {
    async filterPieces(params) {
        const { platformId, includeHidden, pieces } = params
        if (isNil(platformId) || includeHidden) {
            return defaultPieceHooks.filterPieces({ ...params, pieces })
        }

        const platform = await platformService.getOneOrThrow(platformId)

        const filterPredicate: Record<
        FilteredPieceBehavior,
        (p: PieceMetadataSchema) => boolean
        > = {
            [FilteredPieceBehavior.ALLOWED]: (p) =>
                platform.filteredPieceNames.includes(p.name),
            [FilteredPieceBehavior.BLOCKED]: (p) =>
                !platform.filteredPieceNames.includes(p.name),
        }

        const predicate = filterPredicate[platform.filteredPieceBehavior]
        const resultPieces = pieces.slice().filter(predicate)
        return defaultPieceHooks.filterPieces({ ...params, pieces: resultPieces })
    },
}
