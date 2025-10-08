import { FlowVersion } from '../../flow-version'
import { migrateBranchToRouter } from './migrate-v0-branch-to-router'
import { migrateConnectionIds } from './migrate-v1-connection-ids'
import { migrateAgentPieceV2 } from './migrate-v2-agent-piece'
import { migrateAgentPieceV3 } from './migrate-v3-agent-piece'
import { migrateAgentPieceV4 } from './migrate-v4-agent-piece'

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
]

const apply = (flowVersion: FlowVersion) => {
    return migrations.reduce((acc, migration) => {
        if (acc.schemaVersion === migration.targetSchemaVersion) {
            return migration.migrate(acc)
        }
        return acc
    }, flowVersion)
}

export const flowMigrations = {
    apply,
}