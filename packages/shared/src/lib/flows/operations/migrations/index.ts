import { FlowVersion } from '../../flow-version'
import { migrateBranchToRouter } from './migrate-branch-to-router'

export type Migration = {
    migrate: (flowVersion: FlowVersion) => FlowVersion
}

const migrations: Migration[] = [
    migrateBranchToRouter,
]

const apply = (flowVersion: FlowVersion) => {
    return migrations.reduce((acc, migration) => migration.migrate(acc), flowVersion)
}

export const flowMigrations = {
    apply,
}