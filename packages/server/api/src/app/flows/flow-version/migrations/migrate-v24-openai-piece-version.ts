import { FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateV24OpenaiPieceVersion: Migration = {
    targetSchemaVersion: '24',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== OPENAI_PIECE_NAME || step.settings.pieceVersion !== BROKEN_PIECE_VERSION) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: FIXED_PIECE_VERSION,
                },
            }
        })
        return { ...newVersion, schemaVersion: '25' }
    },
}

const OPENAI_PIECE_NAME = '@activepieces/piece-openai'
const BROKEN_PIECE_VERSION = '0.10.0'
const FIXED_PIECE_VERSION = '0.10.1'
