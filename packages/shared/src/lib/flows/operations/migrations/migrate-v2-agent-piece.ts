import { FlowVersion } from '../../flow-version'
import { AGENT_PIECE_NAME } from '../../util/flow-structure-util'
import { flowMigrationUtil } from './flow-migration-util'
import { Migration } from '.'

export const migrateAgentPieceV2: Migration = {
    targetSchemaVersion: '2',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, AGENT_PIECE_NAME, '0.2.0')
        return {
            ...newVersion,
            schemaVersion: '3',
        }
    },
} 