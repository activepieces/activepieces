import { flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateConnectionIds: Migration = {
    targetSchemaVersion: '1',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        return {
            ...flowVersion,
            schemaVersion: '2',
            connectionIds: flowStructureUtil.extractConnectionIds(flowVersion),
        }
    },
} 