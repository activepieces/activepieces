import { authenticationModule } from './app/authentication/authentication.module'
import { system, validateEnvPropsOnStartup } from './app/helper/system/system'
import { SystemProp } from './app/helper/system/system-prop'
import { databaseConnection } from './app/database/database-connection'
import { logger } from './app/helper/logger'
import { getEdition } from './app/helper/secret-helper'
import { ApEdition } from '@activepieces/shared'
import { seedDevData } from './app/database/seeds/dev-seeds'
import { flowQueueConsumer } from './app/workers/flow-worker/flow-queue-consumer'
import { app } from './app/app'

const start = async () => {
    try {
        setupTimeZone()
        validateEnvPropsOnStartup()
        await databaseConnection.initialize()
        await databaseConnection.runMigrations()

        await seedDevData()

        const edition = getEdition()
        logger.info(`Activepieces ${edition} Edition`)
        switch (edition) {
            case ApEdition.CLOUD:
            case ApEdition.ENTERPRISE:
                break
            case ApEdition.COMMUNITY:
                app.register(authenticationModule)
                break
        }
        await app.listen({
            host: '0.0.0.0',
            port: 3000,
        })

        logger.info(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

The application started on ${system.get(SystemProp.FRONTEND_URL)}, as specified by the AP_FRONTEND_URL variable.
    `)
    }
    catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

start()

// This might be needed as it can be called twice
let shuttingDown = false

function setupTimeZone() {
    // It's important to set the time zone to UTC when working with dates in PostgreSQL.
    // If the time zone is not set to UTC, there can be problems when storing dates in UTC but not considering the UTC offset when converting them back to local time. This can lead to incorrect fields being displayed for the created
    // https://stackoverflow.com/questions/68240368/typeorm-find-methods-returns-wrong-timestamp-time
    process.env.TZ = 'UTC'
}

const stop = async () => {
    if (shuttingDown) return
    shuttingDown = true

    try {
        await app.close()
        await flowQueueConsumer.close()
        logger.info('Server stopped')
        process.exit(0)
    }
    catch (err) {
        logger.error('Error stopping server')
        logger.error(err)
        process.exit(1)
    }
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
