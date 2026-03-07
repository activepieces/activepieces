import { logger } from './config/logger'
import { system, WorkerSystemProp } from './config/configs'
import { worker } from './worker'

const apiUrl = system.getOrThrow(WorkerSystemProp.API_URL)
const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)

async function main(): Promise<void> {
    await worker.start(apiUrl, workerToken)

    process.on('SIGINT', () => {
        worker.stop()
        process.exit(0)
    })
    process.on('SIGTERM', () => {
        worker.stop()
        process.exit(0)
    })
}

main().catch((err) => {
    logger.error({ error: err }, 'Worker crashed')
    process.exit(1)
})
