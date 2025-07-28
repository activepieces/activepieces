import { FlowVersion } from '../../flow-version'
import { AGENT_PIECE_NAME, flowStructureUtil } from '../../util/flow-structure-util'
import { flowMigrationUtil } from './flow-migration-util'
import { Migration } from '.'

export const migrateAgentPieceV4: Migration = {
    targetSchemaVersion: '4',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, AGENT_PIECE_NAME, '0.2.4')
        const agentIds = flowStructureUtil.extractAgentIds(newVersion)
        return {
            ...newVersion,
            schemaVersion: '5',
            agentIds,
        }
    },
}

