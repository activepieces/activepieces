import { isNil } from '@activepieces/core-utils'
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { ApEdition, FilteredPieceBehavior, PiecesFilterType, PlatformWithoutFederatedAuth } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { PieceMetadataSchema } from '../../../pieces/metadata/piece-metadata-entity'
import { platformService } from '../../../platform/platform.service'
import { projectRepo } from '../../../project/project-repo'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'
import { pieceSetRepo, pieceSetService } from '../piece-set/piece-set.service'

export const enterpriseFilteringUtils = (log: FastifyBaseLogger) => ({
    async filterComponents({ platformId, projectId, summaries }: FilterComponentsParams): Promise<PieceMetadataModelSummary[]> {
        const edition = system.getEdition()
        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return summaries
        }
        if (isNil(platformId)) {
            return summaries
        }
        const platform = await platformService(log).getOne(platformId)
        if (isNil(platform)) {
            return summaries
        }
        const platformFilteredSummaries = summaries.map((summary) => ({
            ...summary,
            suggestedActions: summary.suggestedActions?.filter(
                (action) => !(platform.filteredActionNames[summary.name] ?? []).includes(action.name),
            ),
            suggestedTriggers: summary.suggestedTriggers?.filter(
                (trigger) => !(platform.filteredTriggerNames[summary.name] ?? []).includes(trigger.name),
            ),
        }))
        if (isNil(projectId)) {
            return platformFilteredSummaries
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (!platformPlan.managePiecesEnabled) {
            return platformFilteredSummaries
        }
        return filterComponentsBasedOnPieceSet({ log, projectId, platformId, summaries: platformFilteredSummaries })
    },
    async filter(params: FilterParams): Promise<PieceMetadataSchema[]> {
        const edition = system.getEdition()
        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return params.pieces
        }
        const { platformId, includeHidden, pieces, projectId } = params
        if (isNil(platformId) || includeHidden) {
            return pieces
        }

        const platformWithPlan = await platformService(log).getOne(platformId)
        if (isNil(platformWithPlan)) {
            return pieces
        }
        const platformFilteredPieces = await filterPiecesBasedPlatform(platformWithPlan, pieces)
        if (isNil(projectId)) {
            return platformFilteredPieces
        }

        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (platformPlan.managePiecesEnabled) {
            return filterBasedOnPieceSet({ log, projectId, platformId, pieces: platformFilteredPieces })
        }
        return filterBasedOnProject(log, projectId, platformFilteredPieces)
    },
    async isFiltered({ piece, projectId, platformId }: IsFilteredParams): Promise<boolean> {
        const filteredPieces = await this.filter({
            pieces: [piece],
            projectId,
            platformId,
        })
        return filteredPieces.length === 0
    },
})

type FilterComponentsParams = {
    platformId: string | undefined
    projectId?: string
    summaries: PieceMetadataModelSummary[]
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

type FilterByPieceSetParams = {
    log: FastifyBaseLogger
    projectId: string
    platformId: string
    pieces: PieceMetadataSchema[]
}

type FilterComponentsByPieceSetParams = {
    log: FastifyBaseLogger
    projectId: string
    platformId: string
    summaries: PieceMetadataModelSummary[]
}

async function filterComponentsBasedOnPieceSet({ log, projectId, platformId, summaries }: FilterComponentsByPieceSetParams): Promise<PieceMetadataModelSummary[]> {
    const project = await projectRepo().findOneBy({ id: projectId })
    const pieceSetId = project?.pieceSetId ?? null

    const resolvedSet = isNil(pieceSetId)
        ? await pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
        : (await pieceSetRepo().findOneBy({ id: pieceSetId, platformId }))
            ?? await pieceSetService(log).getOrCreateDefaultPieceSet(platformId)

    return summaries.map((summary) => ({
        ...summary,
        suggestedActions: summary.suggestedActions?.filter(
            (action) => !(resolvedSet.config.disabledActions[summary.name] ?? []).includes(action.name),
        ),
        suggestedTriggers: summary.suggestedTriggers?.filter(
            (trigger) => !(resolvedSet.config.disabledTriggers[summary.name] ?? []).includes(trigger.name),
        ),
    }))
}

async function filterBasedOnPieceSet({ log, projectId, platformId, pieces }: FilterByPieceSetParams): Promise<PieceMetadataSchema[]> {
    const project = await projectRepo().findOneBy({ id: projectId })
    const pieceSetId = project?.pieceSetId ?? null

    const resolvedSet = isNil(pieceSetId)
        ? await pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
        : (await pieceSetRepo().findOneBy({ id: pieceSetId, platformId }))
            ?? await pieceSetService(log).getOrCreateDefaultPieceSet(platformId)

    return pieces.filter((p) => !resolvedSet.config.disabledPieces.includes(p.name))
}

async function filterBasedOnProject(
    log: FastifyBaseLogger,
    projectId: string,
    pieces: PieceMetadataSchema[],
): Promise<PieceMetadataSchema[]> {
    const { pieces: allowedPieces, piecesFilterType } = await projectLimitsService(log).getOrCreateDefaultPlan(projectId)

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
    platformWithPlan: PlatformWithoutFederatedAuth,
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
