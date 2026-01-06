import { databaseConnection } from './database-connection'
import { databaseSeeds } from './seeds'

export async function initializeDatabase({ runMigrations }: { runMigrations: boolean }): Promise<void> {
    if (runMigrations) {
        const migrationConnection = databaseConnection({ forMigration: true })
        await migrationConnection.initialize()
        await migrationConnection.runMigrations()
        await migrationConnection.destroy()
    }
    await databaseConnection().initialize()
    await databaseSeeds.run()
}