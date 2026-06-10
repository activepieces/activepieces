import { execSync } from 'child_process'
import semver from 'semver'
import { Migration } from '../../packages/server/api/src/app/database/migration'

const MIGRATION_DIRS = [
    'packages/server/api/src/app/database/migration/postgres',
    'packages/server/api/src/app/database/migration/common',
    'packages/server/api/src/app/ee/database/migrations/postgres',
]

function getChangedMigrationFiles(): string[] {
    const baseBranch = process.env.GITHUB_BASE_REF ?? 'main'
    const diffOutput = execSync(
        `git diff --name-only --diff-filter=A origin/${baseBranch}...HEAD`,
        { encoding: 'utf-8' },
    ).trim()

    if (!diffOutput) {
        return []
    }

    return diffOutput
        .split('\n')
        .filter((file) =>
            MIGRATION_DIRS.some((dir) => file.startsWith(dir)) && file.endsWith('.ts'),
        )
}

async function checkMigrationFile(filePath: string): Promise<string[]> {
    const errors: string[] = []

    const mod = await import(`../../${filePath}`)
    const MigrationClass = Object.values(mod).find(
        (v): v is new () => Migration => typeof v === 'function' && v.prototype?.up,
    )

    if (!MigrationClass) {
        errors.push('No exported migration class found')
        return errors
    }

    const instance = new MigrationClass()

    if (instance.breaking === undefined) {
        errors.push('Missing "breaking" property (must be set to true or false)')
    }

    if (!instance.release || !semver.valid(instance.release)) {
        errors.push("Missing or invalid \"release\" property (must be valid semver, e.g. release = '0.78.0')")
    }

    if (instance.breaking !== true) {
        if (typeof instance.down !== 'function') {
            errors.push('Missing down() method (required for non-breaking migrations)')
        }
    }

    return errors
}

async function main(): Promise<void> {
    const changedFiles = getChangedMigrationFiles()

    if (changedFiles.length === 0) {
        console.log('No new migration files detected.')
        process.exit(0)
    }

    console.log(`Checking ${changedFiles.length} new migration file(s)...\n`)

    let hasErrors = false

    for (const file of changedFiles) {
        const errors = await checkMigrationFile(file)
        if (errors.length > 0) {
            hasErrors = true
            console.error(`❌ ${file}:`)
            for (const error of errors) {
                console.error(`   - ${error}`)
            }
            console.error()
        }
        else {
            console.log(`✅ ${file}`)
        }
    }

    if (hasErrors) {
        console.error('\nMigration rollback checks failed. See errors above.')
        console.error('All new migrations must:')
        console.error('  1. Set breaking = true or breaking = false')
        console.error("  2. Set release = '<semver>' (e.g. '0.78.0')")
        console.error('  3. Have a down() method (unless breaking = true)')
        process.exit(1)
    }

    console.log('\n✅ All migration rollback checks passed.')
}

main()
