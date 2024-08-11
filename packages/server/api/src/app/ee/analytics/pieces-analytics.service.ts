import { logger } from '@activepieces/server-shared'
import { ActionType, flowHelper, FlowStatus, isNil, PieceAction, PieceTrigger, TriggerType } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowEntity } from '../../flows/flow/flow.entity'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

const flowRepo = repoFactory(FlowEntity)
const flowVersionRepo = repoFactory(FlowVersionEntity)
const activeProjectsIncludingCodePieces = new Set<string>()
const activeProjectsExcludingCodePieces = new Set<string>()

export const piecesAnalyticsService = {
    async init(): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.PIECES_ANALYTICS, piecesAnalyticsHandler)
        await systemJobsSchedule.upsertJob({
            job: {
                name: SystemJobName.PIECES_ANALYTICS,
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: '0 12 * * *',
            },
        })
    },
}

async function piecesAnalyticsHandler(): Promise<void> {
    const flowIds: string[] = (await flowRepo().createQueryBuilder().select('id').where({
        status: FlowStatus.ENABLED,
    }).getRawMany()).map((flow) => flow.id)
    const activeProjects: Record<string, Set<string>> = {}
    logger.info('Syncing pieces analytics')
    for (const flowId of flowIds) {
        const flow = await flowRepo().findOneBy({
            id: flowId,
        })
        const publishedVersionId = flow?.publishedVersionId
        if (isNil(flow) || isNil(publishedVersionId)) {
            continue
        }
        const flowVersion = await flowVersionRepo().findOneBy({
            id: publishedVersionId,
        })
        if (isNil(flowVersion)) {
            continue
        }
        const pieces = flowHelper.getAllSteps(flowVersion.trigger).filter(
            (step) =>
                step.type === ActionType.PIECE || step.type === TriggerType.PIECE || step.type === ActionType.CODE,
        ).map((step) => {
            if (step.type === ActionType.CODE) {
                if (step.settings.sourceCode.packageJson.length > 0) {
                    activeProjectsIncludingCodePieces.add(flow.projectId)
                }
                else {
                    activeProjectsExcludingCodePieces.add(flow.projectId)
                }
                return null
            }
            const clonedStep = step as (PieceTrigger | PieceAction)
            return {
                name: clonedStep.settings.pieceName,
                version: clonedStep.settings.pieceVersion,
            }
        })

        logger.info('The number of code pieces with package.json: ', activeProjectsIncludingCodePieces.size)
        logger.info('The number of code pieces without package.json: ', activeProjectsExcludingCodePieces.size)

        for (const piece of pieces) {
            try {
                if (isNil(piece)) continue
                const pieceMetadata = await pieceMetadataService.getOrThrow({
                    name: piece.name,
                    version: piece.version,
                    projectId: flow.projectId,
                })
                const pieceId = pieceMetadata.id!
                activeProjects[pieceId] = activeProjects[pieceId] || new Set()
                activeProjects[pieceId].add(flow.projectId)
            }
            catch (e) {
                if (isNil(piece)) continue
                logger.error({
                    name: piece.name,
                    version: piece.version,
                }, 'Piece not found in pieces analytics service')
            }
        }
    }
    for (const id in activeProjects) {
        await pieceMetadataService.updateUsage({
            id,
            usage: activeProjects[id].size,
        })
    }
    logger.info('Synced pieces analytics finished')
}
