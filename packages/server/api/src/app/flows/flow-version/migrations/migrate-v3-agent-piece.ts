import { FlowVersion } from '@activepieces/shared'
import { Migration } from '.'
import { flowMigrationUtil } from './flow-migration-util'

export const migrateAgentPieceV3: Migration = {
    targetSchemaVersion: '3',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowMigrationUtil.pinPieceToVersion(flowVersion, '@activepieces/piece-agent', '0.2.2')
        return {
            ...newVersion,
            schemaVersion: '4',
        }
    },
}
