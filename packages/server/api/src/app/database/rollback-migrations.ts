/* eslint-disable no-console */
import semver from 'semver'
import { DataSource } from 'typeorm'
import { Migration } from './migration'
import { getMigrations } from './postgres-connection'

export async function rollbackToVersion(params: {
    dataSource: DataSource
    targetVersion: string
    force: boolean
}): Promise<void> {
    const { dataSource, targetVersion, force } = params

    if (!semver.valid(targetVersion)) {
        throw new Error(`Invalid semver version: ${targetVersion}`)
    }

    const migrationClasses = getMigrations()
    const candidates = identifyCandidates(migrationClasses, targetVersion)
    if (candidates.length === 0) {
        console.log(`No migrations found to rollback for versions after ${targetVersion}`)
        return
    }

    console.log(`Found ${candidates.length} migration(s) to rollback:`)
    for (const m of candidates) {
        console.log(`  - ${m.name ?? 'unknown'} (release: ${m.release}, breaking: ${m.breaking ?? false})`)
    }

    await verifyDatabaseState(dataSource, candidates)

    const breakingMigrations = candidates.filter((m) => m.breaking === true)
    if (breakingMigrations.length > 0 && !force) {
        console.error('\nThe following migrations are marked as breaking:')
        for (const m of breakingMigrations) {
            console.error(`  - ${m.name ?? 'unknown'}`)
        }
        console.error('\nRolling back breaking migrations may cause data loss.')
        console.error('Use --force to proceed anyway.')
        process.exit(1)
    }

    for (let i = 0; i < candidates.length; i++) {
        const migration = candidates[i]
        console.log(`\nReverting (${i + 1}/${candidates.length}): ${migration.name ?? 'unknown'}...`)
        await dataSource.undoLastMigration()
        console.log('  Reverted successfully.')
    }

    console.log(`\nRollback complete. Reverted ${candidates.length} migration(s).`)
}

export function identifyCandidates(
    migrationClasses: (new () => Migration)[],
    targetVersion: string,
): Migration[] {
    const instances = migrationClasses.map((MigrationClass) => new MigrationClass())

    const candidates = instances.filter((m) => {
        if (!m.release) {
            return false
        }
        return semver.gt(m.release, targetVersion)
    })

    return candidates.reverse()
}

export async function verifyDatabaseState(
    dataSource: DataSource,
    candidates: Migration[],
): Promise<void> {
    const executedMigrations = await dataSource.query(
        'SELECT "name" FROM "migrations" ORDER BY "id" DESC LIMIT $1',
        [candidates.length],
    )

    const executedNames: string[] = executedMigrations.map(
        (row: { name: string }) => row.name,
    )

    for (let i = 0; i < candidates.length; i++) {
        const candidateName = candidates[i].name
        const executedName = executedNames[i]

        if (candidateName !== executedName) {
            throw new Error(
                `Migration order mismatch: expected "${candidateName}" at position ${i + 1} from the top, `
                + `but found "${executedName}" in the database. `
                + 'The database state does not match the expected migration history. Aborting rollback.',
            )
        }
    }
}
