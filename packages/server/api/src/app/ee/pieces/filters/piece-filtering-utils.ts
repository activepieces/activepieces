import { isNil } from '@activepieces/core-utils'
import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { ApEdition, isComponentVisible, isPieceVisible, PieceSet, PiecesFilterType, PlatformPlan, PlatformWithoutFederatedAuth } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { PieceMetadataSchema } from '../../../pieces/metadata/piece-metadata-entity'
import { platformService } from '../../../platform/platform.service'
import { projectRepo } from '../../../project/project-repo'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'
import { pieceSetRepo, pieceSetService } from '../piece-set/piece-set.service'

export const enterpriseFilteringUtils = (log: FastifyBaseLogger) => ({
    async loadFilterContext({ platformId, projectId }: LoadFilterContextParams): Promise<PieceFilterContext | null> {
        const edition = system.getEdition()
        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return null
        }
        if (isNil(platformId)) {
            return null
        }
        const [platform, platformPlan] = await Promise.all([
            platformService(log).getOne(platformId),
            platformPlanService(log).getOrCreateForPlatform(platformId),
        ])
        if (isNil(platform)) {
            return null
        }
        const pieceSet = platformPlan.managePiecesEnabled && !isNil(projectId)
            ? await resolvePieceSetForProject({ log, projectId, platformId })
            : null
        return { platform, platformPlan, pieceSet }
    },
    async filterComponents({ platformId, projectId, summaries, filterContext }: FilterComponentsParams): Promise<PieceMetadataModelSummary[]> {
        const context = filterContext !== undefined
            ? filterContext
            : await this.loadFilterContext({ platformId, projectId })
        if (isNil(context)) {
            return summaries
        }
        const { platform, platformPlan } = context
        if (isNil(projectId) || !platformPlan.managePiecesEnabled) {
            return summaries
        }
        const pieceSet = context.pieceSet ?? await resolvePieceSetForProject({ log, projectId, platformId: platform.id })
        return summaries.map((summary) => ({
            ...summary,
            suggestedActions: summary.suggestedActions?.filter(
                (action) => isComponentVisible({ selected: pieceSet.config.selectedActions[summary.name], name: action.name }),
            ),
            suggestedTriggers: summary.suggestedTriggers?.filter(
                (trigger) => isComponentVisible({ selected: pieceSet.config.selectedTriggers[summary.name], name: trigger.name }),
            ),
        }))
    },
    async filter(params: FilterParams): Promise<PieceMetadataSchema[]> {
        const { platformId, includeHidden, pieces, projectId, filterContext } = params
        if (includeHidden) {
            return pieces
        }
        const context = filterContext !== undefined
            ? filterContext
            : await this.loadFilterContext({ platformId, projectId })
        if (isNil(context)) {
            return pieces
        }
        if (isNil(projectId)) {
            return pieces
        }
        if (context.platformPlan.managePiecesEnabled) {
            const pieceSet = context.pieceSet ?? await resolvePieceSetForProject({ log, projectId, platformId: context.platform.id })
            return pieces.filter((p) => isPieceVisible({ pieces: pieceSet.config.pieces, name: p.name }))
        }
        return filterBasedOnProject(log, projectId, pieces)
    },
    async filterPieceComponents({ piece, platformId, projectId }: FilterPieceComponentsParams): Promise<PieceMetadataModel> {
        const context = await this.loadFilterContext({ platformId, projectId })
        if (isNil(context) || isNil(context.pieceSet)) {
            return piece
        }
        const { pieceSet } = context
        const actionVisible = (name: string): boolean =>
            isComponentVisible({ selected: pieceSet.config.selectedActions[piece.name], name })
        const triggerVisible = (name: string): boolean =>
            isComponentVisible({ selected: pieceSet.config.selectedTriggers[piece.name], name })
        return {
            ...piece,
            actions: Object.fromEntries(Object.entries(piece.actions).filter(([name]) => actionVisible(name))),
            triggers: Object.fromEntries(Object.entries(piece.triggers).filter(([name]) => triggerVisible(name))),
        }
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

async function resolvePieceSetForProject({ log, projectId, platformId }: ResolvePieceSetForProjectParams): Promise<PieceSet> {
    const project = await projectRepo().findOneBy({ id: projectId })
    const pieceSetId = project?.pieceSetId ?? null

    return isNil(pieceSetId)
        ? pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
        : (await pieceSetRepo().findOneBy({ id: pieceSetId, platformId }))
            ?? pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
}

/**
 * @deprecated Legacy project-plan (`pieces`/`piecesFilterType`) enforcement for platforms
 * without `managePiecesEnabled`. Piece sets are the replacement; remove once all platforms
 * are migrated to piece sets.
 */
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

export type PieceFilterContext = {
    platform: PlatformWithoutFederatedAuth
    platformPlan: PlatformPlan
    pieceSet: PieceSet | null
}

type LoadFilterContextParams = {
    platformId: string | undefined
    projectId?: string
}

type FilterComponentsParams = {
    platformId: string | undefined
    projectId?: string
    summaries: PieceMetadataModelSummary[]
    filterContext?: PieceFilterContext | null
}

type FilterPieceComponentsParams = {
    piece: PieceMetadataModel
    platformId: string | undefined
    projectId?: string
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
    filterContext?: PieceFilterContext | null
}

type ResolvePieceSetForProjectParams = {
    log: FastifyBaseLogger
    projectId: string
    platformId: string
}
