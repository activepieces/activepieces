import { backgroundMigrationRunner, MigrationLock } from './app/database/background-migration-runner'
import { databaseConnection } from './app/database/database-connection'
import { system } from './app/helper/system/system'

async function main(): Promise<void> {
    process.env.TZ = 'UTC'
    const log = system.globalLogger()
    const singleProcessLock: MigrationLock = {
        runExclusive: async ({ fn }) => fn(),
    }

    const dataSource = databaseConnection()
    await dataSource.initialize()
    await backgroundMigrationRunner.runMigrationsWithCatchup({ dataSource, log, lock: singleProcessLock })
    await backgroundMigrationRunner.run({ dataSource, log, lock: singleProcessLock })
    await dataSource.destroy()
}

main().catch((error: unknown) => {
    system.globalLogger().error({ error }, '[migrate] Failed to apply blocking and background migrations')
    process.exit(1)
})
