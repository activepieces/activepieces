import { FlowVersion } from '../../flow-version'
import { migrateBranchToRouter } from './migrate-v0-branch-to-router'
import { migrateConnectionIds } from './migrate-v1-connection-ids'
import { migrateAgentPiece } from './migrate-v2-agent-piece'

export type Migration = {
    name: string
    migrate: (flowVersion: FlowVersion) => FlowVersion
}

const migrations: Migration[] = [
    migrateBranchToRouter,
    migrateConnectionIds,
    migrateAgentPiece,
]

const apply = (flowVersion: FlowVersion) => {
    return migrations.reduce((acc, migration) => migration.migrate(acc), flowVersion)
}

export const flowMigrations = {
    apply,
}