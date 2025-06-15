import { FilteredPieceBehavior, isNil, PiecesFilterType } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { PieceMetadataSchema } from '../../../pieces/piece-metadata-entity'
import {
    defaultPieceHooks,
    PieceMetadataServiceHooks,
} from '../../../pieces/piece-metadata-service/hooks'
import { platformService } from '../../../platform/platform.service'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'

export const enterprisePieceMetadataServiceHooks: PieceMetadataServiceHooks = {
    async filterPieces(params) {
        const { platformId, includeHidden, pieces, projectId } = params
        if (isNil(platformId) || includeHidden) {
            return defaultPieceHooks.filterPieces({ ...params, pieces })
        }


        const resultPieces = await filterPiecesBasedPlatform(platformId, pieces)
        const piecesAfterDefaultFilter = await defaultPieceHooks.filterPieces({ ...params, pieces: resultPieces })

        if (isNil(projectId)) {
            return piecesAfterDefaultFilter
        }
        const filterAfterProject = await filterBasedOnProject(projectId, piecesAfterDefaultFilter)

        if (!isNil(platformId)) {
            return filterAgentsPieceIfPlatformHasLimit(platformId, filterAfterProject)
        }
        return filterAfterProject
    },
}

// TODO(agents): after we enable agents for everyone.
async function filterAgentsPieceIfPlatformHasLimit(platformId: string, pieces: PieceMetadataSchema[]): Promise<PieceMetadataSchema[]> {
    if (!isNil(platformId)) {
        const platformBilling = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)
        return pieces.filter((piece) => {
            if (piece.name === '@activepieces/agent') {
                return platformBilling.agentsLimit && platformBilling.agentsLimit > 0
            }
            return true
        })
    }
    return pieces
}

async function filterBasedOnProject(
    projectId: string,
    pieces: PieceMetadataSchema[],
): Promise<PieceMetadataSchema[]> {
    const { pieces: allowedPieces, piecesFilterType } = await projectLimitsService(system.globalLogger()).getPlanWithPlatformLimits(projectId)

    const filterPredicate: Record<
    PiecesFilterType,
    (p: PieceMetadataSchema) => boolean
    > = {
        [PiecesFilterType.NONE]: () => true,
        [PiecesFilterType.ALLOWED]: (p) =>
            allowedPieces.includes(p.name),
    }

    const predicate = filterPredicate[piecesFilterType]
    return pieces.slice().filter(predicate)
}

/*
    @deprecated This function is deprecated and will be removed in the future. replaced with project filtering
*/
async function filterPiecesBasedPlatform(
    platformId: string,
    pieces: PieceMetadataSchema[],
): Promise<PieceMetadataSchema[]> {
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
    return pieces.slice().filter(predicate)
}
