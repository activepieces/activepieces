import { system, validateEnvPropsOnStartup } from './app/helper/system/system'
import { SystemProp } from './app/helper/system/system-prop'
import { databaseConnection } from './app/database/database-connection'
import { logger } from './app/helper/logger'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { seedDevData } from './app/database/seeds/dev-seeds'
import { flowQueueConsumer } from './app/workers/flow-worker/flow-queue-consumer'
import { setupApp } from './app/app'
import { FastifyInstance } from 'fastify'
import { licenseValidator } from './app/ee/helper/license-validator'
import { getEdition } from './app/helper/secret-helper'

const start = async (app: FastifyInstance): Promise<void> => {
    try {
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

The application started on ${system.get(SystemProp.FRONTEND_URL)}, as specified by the AP_FRONTEND_URL variables.
    `)

        const environemnt = system.get(SystemProp.ENVIRONMENT)
        const pieces = process.env.AP_DEV_PIECES

        if (environemnt === ApEnvironment.DEVELOPMENT) {
            logger.warn(`[WARNING]: The application is running in ${environemnt} mode.`)
            logger.warn(`[WARNING]: This is only shows pieces specified in AP_DEV_PIECES ${pieces} environment variable.`)
        }

        const edition = getEdition()
        if (edition !== ApEdition.COMMUNITY) {
            const verified = await licenseValidator.validate()
            if (!verified) {
                logger.error('[ERROR]: License key is not valid. Please contact sales@activepieces.com')
                process.exit(1)
            }
        }
    }
    catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

// This might be needed as it can be called twice
let shuttingDown = false

function setupTimeZone(): void {
    // It's important to set the time zone to UTC when working with dates in PostgreSQL.
    // If the time zone is not set to UTC, there can be problems when storing dates in UTC but not considering the UTC offset when converting them back to local time. This can lead to incorrect fields being displayed for the created
    // https://stackoverflow.com/questions/68240368/typeorm-find-methods-returns-wrong-timestamp-time
    process.env.TZ = 'UTC'
}

const stop = async (app: FastifyInstance): Promise<void> => {
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

const main = async (): Promise<void> => {

    setupTimeZone()
    await validateEnvPropsOnStartup()
    await databaseConnection.initialize()
    await databaseConnection.runMigrations()
    await seedDevData()
    const app = await setupApp()

    process.on('SIGINT', () => {
        stop(app)
            .catch((e) => logger.error(e, '[Main#stop]'))
    })

    process.on('SIGTERM', () => {
        stop(app)
            .catch((e) => logger.error(e, '[Main#stop]'))
    })

    await start(app)
}

main()
    .catch((e) => logger.error(e, '[Main#main]'))
