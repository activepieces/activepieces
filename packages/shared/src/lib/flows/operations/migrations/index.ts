import { FlowVersion } from '../../flow-version'
import { migrateBranchToRouter } from './migrate-v0-branch-to-router'
import { migrateConnectionIds } from './migrate-v1-connection-ids'

export type Migration = {
    migrate: (flowVersion: FlowVersion) => FlowVersion
}

const migrations: Migration[] = [
    migrateBranchToRouter,
    migrateConnectionIds,
]

const apply = (flowVersion: FlowVersion) => {
    return migrations.reduce((acc, migration) => migration.migrate(acc), flowVersion)
}

export const flowMigrations = {
    apply,
}