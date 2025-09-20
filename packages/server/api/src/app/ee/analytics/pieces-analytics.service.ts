import { FlowActionType, FlowStatus, flowStructureUtil, FlowTriggerType, isNil, PieceAction, PieceTrigger } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowEntity } from '../../flows/flow/flow.entity'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'

const flowRepo = repoFactory(FlowEntity)

export const piecesAnalyticsService = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.PIECES_ANALYTICS, async () => {
            const flowIds: string[] = (await flowRepo().createQueryBuilder().select('id').where({
                status: FlowStatus.ENABLED,
            }).getRawMany()).map((flow) => flow.id)
            const activeProjects: Record<string, Set<string>> = {}
            log.info('Syncing pieces analytics')
            for (const flowId of flowIds) {
                const flow = await flowRepo().findOneBy({
                    id: flowId,
                })
                const publishedVersionId = flow?.publishedVersionId
                if (isNil(flow) || isNil(publishedVersionId)) {
                    continue
                }
                const flowVersion = await flowVersionService(log).getOne(publishedVersionId)
                if (isNil(flowVersion)) {
                    continue
                }
                const pieces = flowStructureUtil.getAllSteps(flowVersion.trigger).filter(
                    (step) =>
                        step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE,
                ).map((step) => {
                    const clonedStep = step as (PieceTrigger | PieceAction)
                    return {
                        name: clonedStep.settings.pieceName,
                        version: clonedStep.settings.pieceVersion,
                    }
                })
                const platformId = await projectService.getPlatformId(flow.projectId)

                for (const piece of pieces) {
                    try {   
                        const pieceMetadata = await pieceMetadataService(log).getOrThrow({
                            name: piece.name,
                            version: piece.version,
                            projectId: flow.projectId,
                            platformId,
                        })
                        const pieceId = pieceMetadata.id!
                        activeProjects[pieceId] = activeProjects[pieceId] || new Set()
                        activeProjects[pieceId].add(flow.projectId)
                    }
                    catch (e) {
                        log.error({
                            name: piece.name,
                            version: piece.version,
                        }, 'Piece not found in pieces analytics service')
                    }
                }
            }
            for (const id in activeProjects) {
                await pieceMetadataService(log).updateUsage({
                    id,
                    usage: activeProjects[id].size,
                })
            }
            log.info('Synced pieces analytics finished')
        })
        await systemJobsSchedule(log).upsertJob({
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
})