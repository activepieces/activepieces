import { 
    FlowVersion, 
    isNil,
    LATEST_SCHEMA_VERSION,
    spreadIfDefined,
} from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { flowMigrations } from '../flow/migrations'
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


        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await flowVersionBackupService.store(flowVersion)
        }
        

        const migratedFlowVersion: FlowVersion = await flowMigrations.apply(flowVersion)

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