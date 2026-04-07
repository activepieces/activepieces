import {
    FlowActionType,
    flowPieceUtil,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    isNil,
} from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../../project/project-service'
import { flowService } from '../../flow/flow.service'
import { Migration } from '.'

// we needed to rerun this migration
export const migrateV20StripPieceVersionWildcards: Migration = {
    targetSchemaVersion: '20',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const log = system.globalLogger()
        const flow = await flowService(log).getOneById(flowVersion.flowId)
        const platformId = isNil(flow)
            ? undefined
            : await projectService(log).getPlatformId(flow.projectId)

        const stepNameToExactVersion: Record<string, string> = {}
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)

        for (const step of steps) {
            if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
                continue
            }
            const version: string = step.settings.pieceVersion
            if (!version.startsWith('~') && !version.startsWith('^')) {
                continue
            }
            const pieceMetadata = await pieceMetadataService(log).get({
                platformId,
                name: step.settings.pieceName,
                version,
            })
            stepNameToExactVersion[step.name] = isNil(pieceMetadata)
                ? flowPieceUtil.getExactVersion(version)
                : pieceMetadata.version
        }

        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const exactVersion = stepNameToExactVersion[step.name]
            if (isNil(exactVersion)) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: exactVersion,
                },
            }
        })

        return {
            ...newFlowVersion,
            schemaVersion: '21',
        }
    },
}
