import { getApiUrl, getSocketUrl, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { worker } from './worker'

const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)

async function main(): Promise<void> {
    const containerType = system.get(WorkerSystemProp.CONTAINER_TYPE) ?? 'WORKER_AND_APP'
    await worker.start({ apiUrl: getApiUrl(), socketUrl: getSocketUrl(), workerToken, withHealthServer: containerType === 'WORKER' })

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
}

main().catch((err) => {
    logger.error({ error: err }, 'Worker crashed')
    process.exit(1)
})

