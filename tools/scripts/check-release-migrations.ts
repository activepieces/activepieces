import * as fs from 'fs'
import { getBackgroundMigrations, getMigrations } from '../../packages/server/api/src/app/database/postgres-connection'
import { Migration } from '../../packages/server/api/src/app/database/migration'
import { BackgroundMigration } from '../../packages/server/api/src/app/database/background-migration'

function findMigrationsForRelease(releaseVersion: string): Migration[] {
    const migrationClasses = getMigrations()
    const instances = migrationClasses.map((M) => new M())
    return instances.filter((m) => m.release === releaseVersion)
}

function findBackgroundMigrationsForRelease(releaseVersion: string): BackgroundMigration[] {
    return getBackgroundMigrations().map((M) => new M()).filter((m) => m.release === releaseVersion)
}

function main(): void {
    const tag = process.argv[2]
    if (!tag) {
        console.error('Usage: check-release-migrations.ts <version or tag> [--json]')
        process.exit(1)
    }
    const releaseVersion = tag.split('-')[0]

    const migrations = findMigrationsForRelease(releaseVersion)
    const breakingMigrations = migrations.filter((m) => m.breaking === true)
    const backgroundMigrations = findBackgroundMigrationsForRelease(releaseVersion)
    const migrationsJson = JSON.stringify({
        blocking: migrations.length,
        background: backgroundMigrations.length,
        breaking: breakingMigrations.map((m) => m.name ?? 'unknown'),
    })

    const outputFile = process.env.GITHUB_OUTPUT
    if (outputFile) {
        fs.appendFileSync(outputFile, `migration_count=${migrations.length}\n`)
        fs.appendFileSync(outputFile, `has_breaking=${breakingMigrations.length > 0}\n`)
        fs.appendFileSync(outputFile, `breaking_names=${breakingMigrations.map((m) => m.name ?? 'unknown').join(', ')}\n`)
        fs.appendFileSync(outputFile, `migrations_json=${migrationsJson}\n`)
    }

    if (process.argv.includes('--json')) {
        console.log(migrationsJson)
        return
    }

    if (migrations.length === 0) {
        console.log(`No migrations tagged for release ${releaseVersion}.`)
    }
    else {
        console.log(`Found ${migrations.length} migration(s) for release ${releaseVersion}:`)
        for (const m of migrations) {
            const label = m.breaking === true ? 'BREAKING' : 'safe'
            console.log(`  ${label}: ${m.name ?? 'unknown'}`)
        }
    }
    if (backgroundMigrations.length > 0) {
        console.log(`Found ${backgroundMigrations.length} background migration(s) for release ${releaseVersion}:`)
        for (const m of backgroundMigrations) {
            console.log(`  background: ${m.name}`)
        }
    }

    if (breakingMigrations.length > 0) {
        console.log(`\n${breakingMigrations.length} breaking migration(s) detected.`)
    }
}

main()
