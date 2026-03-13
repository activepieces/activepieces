import {
    FlowVersion,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    ProjectId,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

export const flowVersionMigrationService = (log: FastifyBaseLogger) => ({
    async migrate(flowVersion: FlowVersion, projectId?: ProjectId): Promise<FlowVersion> {
        // Early exit if already at latest version
        if (flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await flowVersionBackupService(log).store(flowVersion)
        }

        const migratedFlowVersion: FlowVersion = await flowMigrations.apply(flowVersion, { log, projectId })

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
})