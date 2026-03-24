import { getApiUrl, getSocketUrl, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { worker } from './worker'

const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)

async function main(): Promise<void> {
    await worker.start({ apiUrl: getApiUrl(), socketUrl: getSocketUrl(), workerToken })

    const shutdown = async () => {
        const timeout = setTimeout(() => {
            logger.warn('Graceful shutdown timed out, forcing exit')
            process.exit(1)
        }, 30_000)
        await worker.stop()
        clearTimeout(timeout)
        process.exit(0)
    }
    process.on('SIGINT', () => void shutdown())
    process.on('SIGTERM', () => void shutdown())

    process.on('uncaughtException', (err) => {
        logger.error({ error: err }, 'Uncaught exception in worker process — staying alive')
    })
    process.on('unhandledRejection', (reason) => {
        logger.error({ error: reason }, 'Unhandled rejection in worker process — staying alive')
    })
}

main().catch((err) => {
    logger.error({ error: err }, 'Worker crashed')
    process.exit(1)
})
