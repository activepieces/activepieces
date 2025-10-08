import { FileCompression, FileType, flowMigrations, FlowVersion, LATEST_SCHEMA_VERSION, spreadIfDefined } from '@activepieces/shared'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { flowVersionRepo } from './flow-version.service'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate(flowVersion: FlowVersion): Promise<FlowVersion> {
        // Early exit if already at latest version
        if (flowVersion.schemaVersion === LATEST_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const migratedFlowVersion: FlowVersion = flowMigrations.apply(flowVersion)
        if (flowVersion.schemaVersion === migratedFlowVersion.schemaVersion) {
            return flowVersion
        }
        const data = Buffer.from(JSON.stringify(flowVersion))
        const file = await fileService(log).save({
            type: FileType.FLOW_VERSION_BACKUP,
            data,
            size: data.length,
            metadata: {
                flowVersionId: flowVersion.id,
                ...spreadIfDefined('schemaVersion', flowVersion.schemaVersion),
            },
            compression: FileCompression.NONE,
        })
        await flowVersionRepo().update(flowVersion.id, {
            schemaVersion: migratedFlowVersion.schemaVersion,
            ...spreadIfDefined('trigger', migratedFlowVersion.trigger),
            connectionIds: migratedFlowVersion.connectionIds,
            agentIds: migratedFlowVersion.agentIds,
            backupFileId: file.id,
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },
}