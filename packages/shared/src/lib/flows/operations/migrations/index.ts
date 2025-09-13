import { FlowVersion } from '../../flow-version'
import { migrateBranchToRouter } from './migrate-v0-branch-to-router'
import { migrateConnectionIds } from './migrate-v1-connection-ids'
import { migrateAgentPieceV2 } from './migrate-v2-agent-piece'
import { migrateAgentPieceV3 } from './migrate-v3-agent-piece'
import { migrateAgentPieceV4 } from './migrate-v4-agent-piece'
import { migrateHttpToWebhookV5 } from './migrate-v5-http-to-webhook'
import { migratePropertySettingsV6 } from './migrate-v6-property-settings'

export type Migration = {
    targetSchemaVersion: string | undefined
    migrate: (flowVersion: FlowVersion) => FlowVersion
}

const migrations: Migration[] = [
    migrateBranchToRouter,
    migrateConnectionIds,
    migrateAgentPieceV2,
    migrateAgentPieceV3,
    migrateAgentPieceV4,
    migrateHttpToWebhookV5,
    migratePropertySettingsV6,
] as const

export const flowMigrations = {
    apply: (flowVersion: FlowVersion): FlowVersion => {
        return migrations.reduce((acc, migration: Migration) => {
            if (acc.schemaVersion === migration.targetSchemaVersion) {
                return migration.migrate(acc)
            }
            return acc
        }, flowVersion)
    },
}