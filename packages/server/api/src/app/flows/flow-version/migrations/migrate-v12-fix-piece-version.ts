import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    isNil,
    tryCatch,
} from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../../project/project-service'
import { flowService } from '../../flow/flow.service'
import { Migration } from '.'

export const migrateV12FixPieceVersion: Migration = {
    targetSchemaVersion: '12',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        if (flowVersion.state !== FlowVersionState.LOCKED) {
            return {
                ...flowVersion,
                schemaVersion: '13',
            }
        }

        const flow = await flowService(system.globalLogger()).getOneById(flowVersion.flowId)
        if (isNil(flow)) {
            return {
                ...flowVersion,
                schemaVersion: '13',
            }
        }
        const platformId = await projectService.getPlatformId(flow.projectId)
        const stepNameToPieceVersion: Record<string, string> = {}
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        for (const step of steps) {
            if (step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE) {
                const { data: pieceMetadata } = await tryCatch(async () => pieceMetadataService(system.globalLogger()).getOrThrow({
                    platformId,
                    name: step.settings.pieceName,
                    version: step.settings.pieceVersion,
                }),
                )
                if (!isNil(pieceMetadata)) {
                    stepNameToPieceVersion[step.name] = pieceMetadata.version
                }
            }
        }
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (stepNameToPieceVersion[step.name]) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: stepNameToPieceVersion[step.name],
                    },
                }
            }
            return step
        })
        return {
            ...newFlowVersion,
            schemaVersion: '13',
        }
    },
}

