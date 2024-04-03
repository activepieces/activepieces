import { ActionType, FlowStatus, PieceAction, PieceTrigger, TriggerType, flowHelper, isNil } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'
import { FlowEntity } from '../../flows/flow/flow.entity'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { logger } from '@activepieces/server-shared'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

const flowRepo = repoFactory(FlowEntity)
const flowVersionRepo = repoFactory(FlowVersionEntity)
export const piecesAnalyticsService = {
    async init(): Promise<void> {
        await systemJobsSchedule.upsertJob({
            job: {
                name: 'pieces-analytics',
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: '0 12 * * *',
            },
            async handler() {
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
                            step.type === ActionType.PIECE || step.type === TriggerType.PIECE,
                    ).map((step) => {
                        const clonedStep = step as (PieceTrigger | PieceAction)
                        return {
                            name: clonedStep.settings.pieceName,
                            version: clonedStep.settings.pieceVersion,
                        }
                    })
                    for (const piece of pieces) {
                        const pieceMetadata = await pieceMetadataService.getOrThrow({
                            name: piece.name,
                            version: piece.version,
                            projectId: flow.projectId,
                        })
                        const pieceId = pieceMetadata.id!
                        activeProjects[pieceId] = activeProjects[pieceId] || new Set()
                        activeProjects[pieceId].add(flow.projectId)
                    }
                }
                for (const id in activeProjects) {
                    await pieceMetadataService.updateUsage({
                        id,
                        usage: activeProjects[id].size,
                    })
                }
                logger.info('Synced pieces analytics finished')

            },
        })
    },
}
