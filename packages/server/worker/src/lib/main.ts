import { getApiUrl, getSocketUrl, logger, system, WorkerSystemProp, workerSystemSnapshot } from '@activepieces/job-executor'
import { worker } from './worker'

async function main(): Promise<void> {
    workerSystemSnapshot.start()
    const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)
    await worker.start({
        apiUrl: getApiUrl(),
        socketUrl: getSocketUrl(),
        workerToken,
        withHealthServer: (system.get(WorkerSystemProp.CONTAINER_TYPE) ?? 'WORKER_AND_APP') === 'WORKER',
    })

    const shutdown = async (): Promise<void> => {
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
