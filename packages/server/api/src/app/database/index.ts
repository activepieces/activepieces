import { system } from '../helper/system/system'
import { backgroundMigrationRunner } from './background-migration-runner'
import { databaseConnection } from './database-connection'
import { databaseSeeds } from './seeds'

export async function initializeDatabase({ runMigrations }: { runMigrations: boolean }): Promise<void> {
    const ds = databaseConnection()
    await ds.initialize()
    if (runMigrations) {
        await backgroundMigrationRunner.runMigrationsWithCatchup({ dataSource: ds, log: system.globalLogger() })
    }
    await databaseSeeds.run()
}