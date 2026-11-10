import { aiDevtools, aiObservability, evlogSetup } from '@activepieces/server-utils'
import { ApEnvironment } from '@activepieces/shared'
import { getApiUrl, getSocketUrl, shutdownTimeoutMs, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { workerSystemSnapshot } from './utils/system-snapshot'
import { worker } from './worker'

const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)
const LOG_FLUSH_TIMEOUT_MS = 3_000

process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception in worker')
    flushLogsThenExit()
})
process.on('unhandledRejection', (reason) => {
    logger.error({ error: reason }, 'Unhandled rejection in worker')
    flushLogsThenExit()
})

function flushLogsThenExit(): void {
    worker.stopPolling()
    setTimeout(() => process.exit(1), LOG_FLUSH_TIMEOUT_MS)
    Promise.all([evlogSetup.flush(), aiObservability.flush()]).catch(() => undefined).finally(() => process.exit(1))
}

async function main(): Promise<void> {
    await aiDevtools.register({ enabled: system.get(WorkerSystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT })
    workerSystemSnapshot.start()
    const containerType = system.get(WorkerSystemProp.CONTAINER_TYPE) ?? 'WORKER_AND_APP'
    await worker.start({ apiUrl: getApiUrl(), socketUrl: getSocketUrl(), workerToken, withHealthServer: containerType === 'WORKER' })

    let shuttingDown = false
    const shutdown = async () => {
        if (shuttingDown) {
            return
        }
        shuttingDown = true
        // stop() still closes the socket after the drain. The pod grace period has to cover
        // the configured wait plus this margin, or Kubernetes kills the process first.
        const timeout = setTimeout(() => {
            logger.warn('Graceful shutdown timed out, forcing exit')
            process.exit(1)
        }, shutdownTimeoutMs() + 5_000)
        await worker.stop()
        await aiObservability.flush()
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

