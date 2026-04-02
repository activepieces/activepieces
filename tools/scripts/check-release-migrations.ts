import * as fs from 'fs'
import { getMigrations } from '../../packages/server/api/src/app/database/postgres-connection'
import { Migration } from '../../packages/server/api/src/app/database/migration'

function findMigrationsForRelease(releaseVersion: string): Migration[] {
    const migrationClasses = getMigrations()
    const instances = migrationClasses.map((M) => new M())
    return instances.filter((m) => m.release === releaseVersion)
}

function main(): void {
    const releaseVersion = process.argv[2]
    if (!releaseVersion) {
        console.error('Usage: check-release-migrations.ts <version>')
        process.exit(1)
    }

    const migrations = findMigrationsForRelease(releaseVersion)
    const breakingMigrations = migrations.filter((m) => m.breaking === true)

    const outputFile = process.env.GITHUB_OUTPUT
    if (outputFile) {
        fs.appendFileSync(outputFile, `migration_count=${migrations.length}\n`)
        fs.appendFileSync(outputFile, `has_breaking=${breakingMigrations.length > 0}\n`)
        fs.appendFileSync(outputFile, `breaking_names=${breakingMigrations.map((m) => m.name ?? 'unknown').join(', ')}\n`)
    }

    if (migrations.length === 0) {
        console.log(`No migrations tagged for release ${releaseVersion}.`)
        return
    }

    console.log(`Found ${migrations.length} migration(s) for release ${releaseVersion}:`)
    for (const m of migrations) {
        const label = m.breaking === true ? 'BREAKING' : 'safe'
        console.log(`  ${label}: ${m.name ?? 'unknown'}`)
    }

    if (breakingMigrations.length > 0) {
        console.log(`\n${breakingMigrations.length} breaking migration(s) detected.`)
    }
}

main()
