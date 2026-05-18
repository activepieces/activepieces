import { databaseConnection } from './database-connection'
import { databaseSeeds } from './seeds'

export async function initializeDatabase({ runMigrations }: { runMigrations: boolean }): Promise<void> {
    await databaseConnection().initialize()
    if (runMigrations) {
        await databaseConnection().runMigrations()
    }
    await databaseSeeds.run()
}