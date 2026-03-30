/* eslint-disable no-console, import-x/order, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env.dev') })

import { databaseConnection } from './app/database/database-connection'
import { rollbackToVersion } from './app/database/rollback-migrations'

function setupTimeZone(): void {
    process.env.TZ = 'UTC'
}

function parseArgs(): { targetVersion: string, force: boolean } {
    const args = process.argv.slice(2)
    let targetVersion: string | undefined
    let force = false

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--to' && args[i + 1]) {
            targetVersion = args[i + 1]
            i++
        }
        else if (args[i] === '--force') {
            force = true
        }
    }

    if (!targetVersion) {
        console.error('Usage: npm run rollback -- --to <version> [--force]')
        console.error('Example: npm run rollback -- --to 0.77.0')
        process.exit(1)
    }

    return { targetVersion, force }
}

async function main(): Promise<void> {
    setupTimeZone()

    const { targetVersion, force } = parseArgs()

    console.log('Initializing database connection...')
    const dataSource = databaseConnection()
    await dataSource.initialize()

    console.log(`Rolling back migrations to version ${targetVersion}...`)
    await rollbackToVersion({
        dataSource,
        targetVersion,
        force,
    })

    await dataSource.destroy()
}

main().catch((e) => {
    console.error('Rollback failed:', e)
    process.exit(1)
})
