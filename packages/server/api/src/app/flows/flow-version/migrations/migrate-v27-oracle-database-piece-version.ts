import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateV27OracleDatabasePieceVersion: Migration = {
    targetSchemaVersion: '27',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
                return step
            }
            if (step.settings.pieceName !== ORACLE_DATABASE_PIECE_NAME || !BROKEN_PIECE_VERSIONS.has(step.settings.pieceVersion)) {
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
        return { ...newVersion, schemaVersion: '28' }
    },
}

const ORACLE_DATABASE_PIECE_NAME = '@activepieces/piece-oracle-database'
const BROKEN_PIECE_VERSIONS = new Set([
    '0.1.11',
    '0.1.12',
])
const FIXED_PIECE_VERSION = '0.1.15'
