/* eslint-disable no-console */
import { databaseConnection } from './app/database/database-connection'
import { rollbackToManifest, rollbackToVersion } from './app/database/rollback-migrations'

function setupTimeZone(): void {
    process.env.TZ = 'UTC'
}

type ParsedArgs =
    | { mode: 'version', targetVersion: string, force: boolean }
    | { mode: 'manifest', targetMigrationNames: string[], force: boolean }

function parseArgs(): ParsedArgs {
    const args = process.argv.slice(2)
    let targetVersion: string | undefined
    let manifestJson: string | undefined
    let force = false

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--to' && args[i + 1]) {
            targetVersion = args[i + 1]
            i++
        }
        else if (args[i] === '--manifest' && args[i + 1]) {
            manifestJson = args[i + 1]
            i++
        }
        else if (args[i] === '--force') {
            force = true
        }
    }

    if (manifestJson !== undefined) {
        let targetMigrationNames: string[]
        try {
            targetMigrationNames = JSON.parse(manifestJson)
            if (!Array.isArray(targetMigrationNames) || !targetMigrationNames.every(n => typeof n === 'string')) {
                throw new Error('Manifest must be a JSON array of strings')
            }
        }
        catch (e) {
            console.error(`Invalid --manifest JSON: ${e instanceof Error ? e.message : String(e)}`)
            process.exit(1)
        }
        return { mode: 'manifest', targetMigrationNames, force }
    }

    if (!targetVersion) {
        console.error('Usage: npm run rollback -- --to <version> [--force]')
        console.error('       npm run rollback -- --manifest \'["MigA","MigB"]\' [--force]')
        process.exit(1)
    }

    return { mode: 'version', targetVersion, force }
}

async function main(): Promise<void> {
    setupTimeZone()

    const parsed = parseArgs()

    console.log('Initializing database connection...')
    const dataSource = databaseConnection()
    await dataSource.initialize()

    if (parsed.mode === 'manifest') {
        console.log(`Rolling back migrations not present in manifest (${parsed.targetMigrationNames.length} entries)...`)
        await rollbackToManifest({
            dataSource,
            targetMigrationNames: parsed.targetMigrationNames,
            force: parsed.force,
        })
    }
    else {
        console.log(`Rolling back migrations to version ${parsed.targetVersion}...`)
        await rollbackToVersion({
            dataSource,
            targetVersion: parsed.targetVersion,
            force: parsed.force,
        })
    }

    await dataSource.destroy()
}

main().catch((e) => {
    console.error('Rollback failed:', e)
    process.exit(1)
})
