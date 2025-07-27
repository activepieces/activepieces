import { FlowVersion } from '../../flow-version'
import { AGENT_PIECE_NAME } from '../../util/flow-structure-util'
import { Migration } from '.'
import { flowMigrationUtil } from './flow-migration-util'

export const migrateAgentPieceV3: Migration = {
    targetSchemaVersion: '3',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, AGENT_PIECE_NAME, '0.2.2')
        return {
            ...newVersion,
            schemaVersion: '4',
        }
    },
} 