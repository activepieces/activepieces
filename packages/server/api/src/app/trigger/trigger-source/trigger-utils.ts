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
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'

export const triggerUtils = (log: FastifyBaseLogger) => ({
    async getPieceTriggerOrThrow({ flowVersion, projectId }: GetPieceTriggerOrThrowParams): Promise<TriggerBase> {

        const pieceTrigger = await this.getPieceTrigger({
            flowVersion,
            projectId,

        })
        if (isNil(pieceTrigger)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'piece_trigger',
                    entityId: flowVersion.trigger.settings.triggerName,
                    message: `Trigger not found for piece ${flowVersion.trigger.settings.pieceName}@${flowVersion.trigger.settings.pieceVersion}`,
                    extra: {
                        pieceName: flowVersion.trigger.settings.pieceName,
                        pieceVersion: flowVersion.trigger.settings.pieceVersion,
                        triggerName: flowVersion.trigger.settings.triggerName,
                    },
                },
            })
        }
        return pieceTrigger
    },
    async getPieceTrigger({ flowVersion, projectId }: GetPieceTriggerOrThrowParams): Promise<TriggerBase | null> {
        if (flowVersion.trigger.type !== FlowTriggerType.PIECE) {
            return null
        }
        const { pieceName, pieceVersion, triggerName } = flowVersion.trigger.settings
        if (isNil(triggerName)) {
            return null
        }
        return this.getPieceTriggerByName({
            pieceName,
            pieceVersion,
            triggerName,
            projectId,
        })
    },
    async getPieceTriggerByName({ pieceName, pieceVersion, triggerName, projectId }: GetPieceTriggerByNameParams): Promise<TriggerBase | null> {
        const platformId = await projectService(log).getPlatformId(projectId)
        const piece = await pieceMetadataService(log).get({
            platformId,
            name: pieceName,
            version: pieceVersion,
        })
        if (isNil(piece) || isNil(triggerName)) {
            return null
        }
        const pieceTrigger = piece.triggers[triggerName]
        return pieceTrigger
    },
})

type GetPieceTriggerByNameParams = {
    pieceName: string
    pieceVersion: string
    triggerName: string
    projectId: ProjectId
}

type GetPieceTriggerOrThrowParams = {
    flowVersion: FlowVersion
    projectId: ProjectId
}