import { flowMigrations, FlowVersion, LATEST_SCHEMA_VERSION } from '@activepieces/shared'
import { IsNull, Not } from 'typeorm'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate() {
        log.info('Starting flow version migration')
        let count = 0
        
        const flowVersions = await flowVersionRepo().find({
            where: [
                { schemaVersion: IsNull() },
                { schemaVersion: Not(LATEST_SCHEMA_VERSION) },
            ],
        })
        log.info(`Found ${flowVersions.length} flow versions to migrate`)
                
        for (const flowVersion of flowVersions) {
            const migratedFlowVersion: FlowVersion = flowMigrations.apply(flowVersion)
            if (flowVersion.schemaVersion === migratedFlowVersion.schemaVersion) {
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