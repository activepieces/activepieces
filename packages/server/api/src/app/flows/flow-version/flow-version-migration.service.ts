import {
    ActivepiecesError,
    ErrorCode,
    FlowVersion,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    ProjectId,
    spreadIfDefined,
    tryCatch,
} from '@activepieces/shared'
import { onCallService } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'
import { inspect } from 'node:util'

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

        const { data: migratedFlowVersion, error: migrationError } = await tryCatch(() => flowMigrations.apply(flowVersion, { log, projectId }))
        if (migrationError) {
            const apError = new ActivepiecesError({
                code: ErrorCode.FLOW_MIGRATION_FAILED,
                params: { flowVersionId: flowVersion.id, message: migrationError.message },
            })
            await onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page(inspect(apError))
            throw migrationError
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
})