import { flowMigrations, FlowVersion } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { flowVersionRepoWrapper } from './flow-version-repo-wrapper'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate(flowVersion: FlowVersion): Promise<FlowVersion> {
        log.info('Starting flow version migration')
     
        const migratedFlowVersion: FlowVersion = flowMigrations.apply(flowVersion)
        if (flowVersion.schemaVersion === migratedFlowVersion.schemaVersion) {
            return flowVersion
        }
        await flowVersionRepoWrapper.update({
            id: flowVersion.id,
            flowVersion: {
                schemaVersion: migratedFlowVersion.schemaVersion,
                trigger: migratedFlowVersion.trigger,
                connectionIds: migratedFlowVersion.connectionIds,
            },
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },
}