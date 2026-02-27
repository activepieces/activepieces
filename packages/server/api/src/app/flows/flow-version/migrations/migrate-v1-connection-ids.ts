import { FlowVersion } from '@activepieces/shared'
import { Migration } from '.'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'

export const migrateConnectionIds: Migration = {
    targetSchemaVersion: '1',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        return {
            ...flowVersion,
            schemaVersion: '2',
            connectionIds: legacyFlowStructureUtil.extractConnectionIds(flowVersion),
        }
    },
}