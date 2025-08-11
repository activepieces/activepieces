import { FlowVersion } from '../../flow-version'
import { flowStructureUtil } from '../../util/flow-structure-util'
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