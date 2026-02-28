import { FlowVersion } from '@activepieces/shared'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'
import { Migration } from '.'

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