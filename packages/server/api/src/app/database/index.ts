import { betterAuthInstance } from '../authentication/better-auth/auth'
import { system } from '../helper/system/system'
import { databaseConnection } from './database-connection'
import { databaseSeeds } from './seeds'

export async function initializeDatabase({ runMigrations }: { runMigrations: boolean }): Promise<void> {
    await databaseConnection().initialize()
    if (runMigrations) {
        await databaseConnection().runMigrations()
    }
    await betterAuthInstance.init(system.globalLogger(), !runMigrations) // this takes the inverse
    await databaseSeeds.run()
}
