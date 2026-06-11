import { system } from '../helper/system/system'
import { conditionalMigrations } from './conditional-migrations'
import { databaseConnection } from './database-connection'
import { databaseSeeds } from './seeds'

export async function initializeDatabase({ runMigrations }: { runMigrations: boolean }): Promise<void> {
    await databaseConnection().initialize()
    if (runMigrations) {
        await databaseConnection().runMigrations()
        await conditionalMigrations.run({ log: system.globalLogger() })
    }
    await databaseSeeds.run()
}