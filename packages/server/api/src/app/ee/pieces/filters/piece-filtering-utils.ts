import { isNil } from '@activepieces/core-utils'
import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { ApEdition, isComponentVisible, isPieceVisible, PieceSet, PieceSetConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { PieceMetadataSchema } from '../../../pieces/metadata/piece-metadata-entity'
import { projectRepo } from '../../../project/project-repo'
import { pieceSetRepo, pieceSetService } from '../piece-set/piece-set.service'

export async function resolveVisibility({ platformId, projectId, log }: ResolveVisibilityParams): Promise<VisibilityPolicy | null> {
    const edition = system.getEdition()
    if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
        return null
    }
    if (isNil(platformId) || isNil(projectId)) {
        return null
    }
    const pieceSet = await resolvePieceSetForProject({ log, projectId, platformId })
    return buildPolicy(pieceSet.config)
}

function buildPolicy(config: PieceSetConfig): VisibilityPolicy {
    const isVisiblePiece = (name: string): boolean => isPieceVisible({ pieces: config.pieces, name })
    return {
        isPieceVisible: isVisiblePiece,
        filterPieces(pieces) {
            return pieces.filter((piece) => isVisiblePiece(piece.name))
        },
        filterComponents(summaries) {
            return summaries.map((summary) => ({
                ...summary,
                suggestedActions: summary.suggestedActions?.filter(
                    (action) => isComponentVisible({ selected: config.selectedActions[summary.name], name: action.name }),
                ),
                suggestedTriggers: summary.suggestedTriggers?.filter(
                    (trigger) => isComponentVisible({ selected: config.selectedTriggers[summary.name], name: trigger.name }),
                ),
            }))
        },
        filterPieceComponents(piece) {
            return {
                ...piece,
                actions: Object.fromEntries(Object.entries(piece.actions).filter(([name]) => isComponentVisible({ selected: config.selectedActions[piece.name], name }))),
                triggers: Object.fromEntries(Object.entries(piece.triggers).filter(([name]) => isComponentVisible({ selected: config.selectedTriggers[piece.name], name }))),
            }
        },
    }
}

async function resolvePieceSetForProject({ log, projectId, platformId }: ResolvePieceSetForProjectParams): Promise<PieceSet> {
    const project = await projectRepo().findOneBy({ id: projectId })
    const pieceSetId = project?.pieceSetId ?? null

    return isNil(pieceSetId)
        ? pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
        : (await pieceSetRepo().findOneBy({ id: pieceSetId, platformId }))
            ?? pieceSetService(log).getOrCreateDefaultPieceSet(platformId)
}

export type VisibilityPolicy = {
    isPieceVisible(name: string): boolean
    filterPieces(pieces: PieceMetadataSchema[]): PieceMetadataSchema[]
    filterComponents(summaries: PieceMetadataModelSummary[]): PieceMetadataModelSummary[]
    filterPieceComponents(piece: PieceMetadataModel): PieceMetadataModel
}

type ResolveVisibilityParams = {
    platformId: string | undefined
    projectId: string | undefined
    log: FastifyBaseLogger
}

type ResolvePieceSetForProjectParams = {
    log: FastifyBaseLogger
    projectId: string
    platformId: string
}
