import { FlowVersion } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { pieceUpgradeService } from '../piece-upgrade.service'
import type { Migration, MigrationContext } from '.'

export const migrateV23UpgradePieceVersions: Migration = {
    targetSchemaVersion: '23',
    migrate: async (flowVersion: FlowVersion, context?: MigrationContext): Promise<FlowVersion> => {
        const log = context?.log ?? system.globalLogger()
        const result = await pieceUpgradeService(log).migrateFlowVersion({ flowVersion, projectId: context?.projectId, platformId: context?.platformId })
        if (!result.migrated) {
            return flowVersion
        }
        return {
            ...result.flowVersion,
            schemaVersion: '24',
        }
    },
}
