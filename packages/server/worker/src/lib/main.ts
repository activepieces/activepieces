import { logger } from './config/logger'
import { system, WorkerSystemProp } from './config/configs'
import { workerSettings } from './config/worker-settings'
import { worker } from './worker'

const apiUrl = system.getOrThrow(WorkerSystemProp.API_URL)
const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)

async function main(): Promise<void> {
    await workerSettings.init(apiUrl, workerToken)
    await worker.start(apiUrl, workerToken)
}

main().catch((err) => {
    logger.error({ error: err }, 'Worker crashed')
    process.exit(1)
})
