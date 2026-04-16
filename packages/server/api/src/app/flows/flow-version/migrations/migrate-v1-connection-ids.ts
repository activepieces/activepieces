import { FlowVersion, flowStructureUtil } from '@activepieces/shared'
import { Migration } from '.'

export const migrateConnectionIds: Migration = {
    targetSchemaVersion: '1',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        return {
            ...flowVersion,
            schemaVersion: '2',
            connectionIds: flowStructureUtil.extractConnectionIds(flowVersion),
        }
    },
}
