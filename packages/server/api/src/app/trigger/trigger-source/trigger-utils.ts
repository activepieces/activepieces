import { TriggerBase } from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    ErrorCode,
    FlowTriggerType,
    FlowVersion,
    isNil,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'

export const triggerUtils = (log: FastifyBaseLogger) => ({
    async getPieceTriggerOrThrow({ flowVersion, projectId }: GetPieceTriggerOrThrowParams): Promise<TriggerBase> {

        const pieceTrigger = await this.getPieceTrigger({
            flowVersion,
            projectId,

        })
        if (isNil(pieceTrigger)) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_TRIGGER_NOT_FOUND,
                params: {
                    pieceName: flowVersion.trigger.settings.pieceName,
                    pieceVersion: flowVersion.trigger.settings.pieceVersion,
                    triggerName: flowVersion.trigger.settings.triggerName,
                },
            })
        }
        return pieceTrigger
    },
    async getPieceTrigger({ flowVersion, projectId }: GetPieceTriggerOrThrowParams): Promise<TriggerBase | null> {
        if (flowVersion.trigger.type !== FlowTriggerType.PIECE) {
            return null
        }
        const platformId = await projectService.getPlatformId(projectId)
        const piece = await pieceMetadataService(log).get({
            projectId,
            platformId,
            name: flowVersion.trigger.settings.pieceName,
            version: flowVersion.trigger.settings.pieceVersion,
        })
        if (isNil(piece) || isNil(flowVersion.trigger.settings.triggerName)) {
            return null
        }
        const pieceTrigger = piece.triggers[flowVersion.trigger.settings.triggerName]
        return pieceTrigger
    },
})

type GetPieceTriggerOrThrowParams = {
    flowVersion: FlowVersion
    projectId: ProjectId
}