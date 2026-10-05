import { FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateV25HttpPieceVersion: Migration = {
    targetSchemaVersion: '25',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== HTTP_PIECE_NAME || !BROKEN_PIECE_VERSIONS.has(step.settings.pieceVersion)) {
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
        return { ...newVersion, schemaVersion: '26' }
    },
}

const HTTP_PIECE_NAME = '@activepieces/piece-http'
const BROKEN_PIECE_VERSIONS = new Set([
    '0.11.11',
    '0.11.12',
    '0.11.13',
    '0.11.14',
    '0.11.15',
    '0.11.16',
    '0.11.17',
    '0.11.18',
    '0.11.19',
    '0.11.20',
])
const FIXED_PIECE_VERSION = '0.11.21'
