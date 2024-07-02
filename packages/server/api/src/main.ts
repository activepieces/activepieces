
import { logger, system } from '@activepieces/server-shared'
import  { FastifyInstance } from 'fastify'
import { appPostBoot } from './app/app'
import { databaseConnection } from './app/database/database-connection'
import { seedDevData } from './app/database/seeds/dev-seeds'
import { setupServer } from './app/server'
import { workerPostBoot } from './app/worker'

const start = async (app: FastifyInstance): Promise<void> => {
    try {
        await app.listen({
            host: '0.0.0.0',
            port: 3000,
        })
        if (system.isWorker()) {
            await workerPostBoot()
        }
        if (system.isApp()) {
            await appPostBoot()
        }
    }
    catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

// This might be needed as it can be called twice
let shuttingDown = false


const stop = async (app: FastifyInstance): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true

    try {
        await app.close()
        process.exit(0)
    }
    catch (err) {
        logger.error('Error stopping server')
        logger.error(err)
        process.exit(1)
    }
}

function setupTimeZone(): void {
    // It's important to set the time zone to UTC when working with dates in PostgreSQL.
    // If the time zone is not set to UTC, there can be problems when storing dates in UTC but not considering the UTC offset when converting them back to local time. This can lead to incorrect fields being displayed for the created
    // https://stackoverflow.com/questions/68240368/typeorm-find-methods-returns-wrong-timestamp-time
    process.env.TZ = 'UTC'
}


const main = async (): Promise<void> => {
    setupTimeZone()
    await databaseConnection.initialize()
    await databaseConnection.runMigrations()
    await seedDevData()
    const app = await setupServer()

    process.on('SIGINT', () => {
        stop(app).catch((e) => logger.error(e, '[Main#stop]'))
    })

    process.on('SIGTERM', () => {
        stop(app).catch((e) => logger.error(e, '[Main#stop]'))
    })

    await start(app)
}

main().catch((e) => {
    logger.error(e, '[Main#main]')
    process.exit(1)
})

