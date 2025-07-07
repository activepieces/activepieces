import { flowMigrations, FlowVersion } from '@activepieces/shared'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate() {
        log.info('Starting flow version migration')
        let count = 0
        const flowVersions = await flowVersionRepo().find()
        const migrationsToApply = ['migrate-v2-agent-piece-to-2.0.0']
        for (const flowVersion of flowVersions) {
            const migratedFlowVersion: FlowVersion = flowMigrations.apply(flowVersion, migrationsToApply)
            if (flowVersion === migratedFlowVersion) {
                continue
            }

            await flowVersionRepo().update(flowVersion.id, {
                schemaVersion: migratedFlowVersion.schemaVersion,
                trigger: migratedFlowVersion.trigger as Record<string, unknown>,
                connectionIds: migratedFlowVersion.connectionIds,
            })
            count++
        }

        log.info(`Flow version migration completed, migrated ${count} flow versions`)
    },
}