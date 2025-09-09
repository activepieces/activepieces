import { ApEdition, FilteredPieceBehavior, isNil, PiecesFilterType, Platform } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { PieceMetadataSchema } from '../../../pieces/piece-metadata-entity'
import { platformService } from '../../../platform/platform.service'

export const enterpriseFilteringUtils = {
    async filter(params: FilterParams): Promise<PieceMetadataSchema[]> {
        const edition = system.getEdition()
        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return params.pieces
        }
        const { platformId, includeHidden, pieces, projectId } = params
        if (isNil(platformId) || includeHidden) {
            return pieces
        }

        const platformWithPlan = await platformService.getOne(platformId)
        if (isNil(platformWithPlan)) {
            return pieces
        }
        const platformFilteredPieces = await filterPiecesBasedPlatform(platformWithPlan, pieces)
        if (isNil(projectId)) {
            return platformFilteredPieces
        }
        return filterBasedOnProject(projectId, platformFilteredPieces)
    },
    async isFiltered({ piece, projectId, platformId }: IsFilteredParams): Promise<boolean> {
        const filteredPieces = await enterpriseFilteringUtils.filter({
            pieces: [piece],
            projectId,
            platformId,
        })
        return filteredPieces.length === 0
    },
}

type IsFilteredParams = {
    piece: PieceMetadataSchema
    projectId: string | undefined
    platformId: string | undefined
}

type FilterParams = {
    platformId?: string
    includeHidden?: boolean
    pieces: PieceMetadataSchema[]
    projectId?: string
}

async function filterBasedOnProject(
    projectId: string,
    pieces: PieceMetadataSchema[],
): Promise<PieceMetadataSchema[]> {
    return pieces
}

/*
    @deprecated This function is deprecated and will be removed in the future. replaced with project filtering
*/
async function filterPiecesBasedPlatform(
    platformWithPlan: Platform,
    pieces: PieceMetadataSchema[],
): Promise<PieceMetadataSchema[]> {

    const filterPredicate: Record<
    FilteredPieceBehavior,
    (p: PieceMetadataSchema) => boolean
    > = {
        [FilteredPieceBehavior.ALLOWED]: (p) =>
            platformWithPlan.filteredPieceNames.includes(p.name),
        [FilteredPieceBehavior.BLOCKED]: (p) =>
            !platformWithPlan.filteredPieceNames.includes(p.name),
    }

    const predicate = filterPredicate[platformWithPlan.filteredPieceBehavior]
    const filteredPieces = pieces.slice().filter(predicate)
    return filteredPieces
}
