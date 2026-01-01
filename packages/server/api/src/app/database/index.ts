import { AppSystemProp } from '@activepieces/server-shared'
import { system } from '../helper/system/system'
import { databaseConnection } from './database-connection'
import { databaseSeeds } from './seeds'

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const BASE_DELAY_MS = 10
const CAP_DELAY_MS = 60000

function calculateBackoffWithJitter(attempt: number): number {
    const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt)
    const cappedDelay = Math.min(CAP_DELAY_MS, exponentialDelay)
    return Math.round(Math.random() * cappedDelay)
}

async function runMigrationsWithRetry(): Promise<void> {
    const maxRetries = system.getNumberOrThrow(AppSystemProp.POSTGRES_MIGRATION_RETRY_ATTEMPTS)
    const log = system.globalLogger()

    let lastError: unknown
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const migrationConnection = databaseConnection({ forMigration: true })
        try {
            await migrationConnection.initialize()
            await migrationConnection.runMigrations()
            await migrationConnection.destroy()
            return
        }
        catch (error) {
            lastError = error
            
            log.warn({
                attempt,
                maxRetries,
                error: error instanceof Error ? error.message : String(error),
            }, '[initializeDatabase] Migration attempt failed')
            
            await migrationConnection.destroy()

            if (attempt < maxRetries) {
                const delayMs = calculateBackoffWithJitter(attempt)
                log.info({ delayMs, attempt, maxRetries }, '[initializeDatabase] Retrying migrations after delay')
                await sleep(delayMs)
            }
        }
    }

    throw lastError
}

export async function initializeDatabase({ runMigrations }: { runMigrations: boolean }): Promise<void> {
    if (runMigrations) {
        await runMigrationsWithRetry()
    }
    await databaseConnection().initialize()
    await databaseSeeds.run()
}