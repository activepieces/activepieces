import { FilteredPieceBehavior, PlatformId } from '@activepieces/ee-shared'
import { PieceMetadataModelSummary } from '../../piece-metadata-entity'
import { platformService } from '../../../ee/platform/platform.service'
import { isNil } from '@activepieces/shared'

export const filterPieces = async ({ pieces, platformId }: FilterPiecesParams): Promise<PieceMetadataModelSummary[]> => {
    if (isNil(platformId)) {
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
}

type FilterPiecesParams = {
    pieces: PieceMetadataModelSummary[]
    platformId?: PlatformId
}
