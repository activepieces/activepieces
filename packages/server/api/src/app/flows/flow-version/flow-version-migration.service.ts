import {
    FlowVersion,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
} from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate(flowVersion: FlowVersion): Promise<FlowVersion> {
        // Early exit if already at latest version
        if (flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION) {
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
            graph: migratedFlowVersion.graph as unknown as Record<string, unknown>,
            connectionIds: migratedFlowVersion.connectionIds,
            agentIds: migratedFlowVersion.agentIds,
            backupFiles,
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },
}