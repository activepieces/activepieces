import { FlowVersion } from '../../flow-version'
import { migrateBranchToRouter } from './migrate-v0-branch-to-router'
import { migrateConnectionIds } from './migrate-v1-connection-ids'
import { migrateAgentPiece } from './migrate-v2-agent-piece'
import { migrateTablesPiece } from './migrate-v3-tables-piece'

export type Migration = {
    name: string
    targetSchemaVersion: string | undefined
    migrate: (flowVersion: FlowVersion) => FlowVersion
}

const migrations: Migration[] = [
    migrateBranchToRouter,
    migrateConnectionIds,
    migrateAgentPiece,
    migrateTablesPiece,
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