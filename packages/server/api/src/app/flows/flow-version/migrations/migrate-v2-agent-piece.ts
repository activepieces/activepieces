import { FlowVersion } from '@activepieces/shared'
import { Migration } from '.'
import { flowMigrationUtil } from './flow-migration-util'

export const migrateAgentPieceV2: Migration = {
    targetSchemaVersion: '2',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, '@activepieces/piece-agent', '0.2.0')
        return {
            ...newVersion,
            schemaVersion: '3',
        }
    },
}
