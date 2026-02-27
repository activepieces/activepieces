import { FlowVersion } from '@activepieces/shared'
import { flowMigrationUtil } from './flow-migration-util'
import { Migration } from '.'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'

export const migrateAgentPieceV4: Migration = {
    targetSchemaVersion: '4',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, '@activepieces/piece-agent', '0.2.4')
        const agentIds = legacyFlowStructureUtil.extractAgentIds(newVersion)
        return {
            ...newVersion,
            schemaVersion: '5',
            agentIds,
        }
    },
}

