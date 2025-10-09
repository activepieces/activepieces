import { 
    flowMigrations,
    FlowVersion, 
    isNil,
    LATEST_SCHEMA_VERSION,
    spreadIfDefined,
} from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { flowVersionBackupService } from './flow-version-backup.service'
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

        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await flowVersionBackupService.store(flowVersion)
        }
        
        await flowVersionRepo().update(flowVersion.id, {
            schemaVersion: migratedFlowVersion.schemaVersion,
            ...spreadIfDefined('trigger', migratedFlowVersion.trigger),
            connectionIds: migratedFlowVersion.connectionIds,
            agentIds: migratedFlowVersion.agentIds,
            backupFiles,
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },
}