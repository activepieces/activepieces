import {
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { flowVersionBackupService } from '../flow-version-backup.service'
import { Migration } from '.'


export const migrateV11FixBrokenPieces: Migration = {
    targetSchemaVersion: '11',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const backedUpFlowVersion = await flowVersionBackupService.get({
            flowVersion,
            schemaVersion: '10',
        })
        if (!backedUpFlowVersion) {
            return {
                ...flowVersion,
                schemaVersion: '12',
            }
        }
        const newVersion = flowStructureUtil.transferFlow(backedUpFlowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE) {
                return step
            }
            if (step.settings.pieceName !== '@activepieces/piece-ai' || !['0.0.1', '0.0.2'].includes(step.settings.pieceVersion)) {
                return step
            }

            const input = step.settings?.input as Record<string, unknown>

            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceName: '@activepieces/piece-ai',
                    pieceVersion: '0.0.4',
                    input,
                },
            }
        })

        return {
            ...newVersion,
            schemaVersion: '12',
        }
    },
}


