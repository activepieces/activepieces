import { backgroundMigrationRunner } from './app/database/background-migration-runner'
import { databaseConnection } from './app/database/database-connection'
import { system } from './app/helper/system/system'

async function main(): Promise<void> {
    process.env.TZ = 'UTC'
    const log = system.globalLogger()
    const dataSource = databaseConnection()
    await dataSource.initialize()
    await backgroundMigrationRunner.runMigrationsWithCatchup({ dataSource, log })
    await backgroundMigrationRunner.run({ dataSource, log })
    await dataSource.destroy()
}

main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
        system.globalLogger().error({ error }, '[migrate] Failed to apply blocking and background migrations')
        process.exit(1)
    })
