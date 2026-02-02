import {
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'


export const migrateV10AiPiecesProviderId: Migration = {
    targetSchemaVersion: '10',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
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
            schemaVersion: '11',
        }
    },
}


