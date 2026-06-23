import { getSocketUrl, system, WorkerSystemProp } from './lib/config/configs'
import { logger } from './lib/config/logger'
import { executorServer } from './lib/runtime/executor-server'
import { workerSystemSnapshot } from './lib/utils/system-snapshot'

async function main(): Promise<void> {
    workerSystemSnapshot.start()
    const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)
    await executorServer.start({ socketUrl: getSocketUrl(), workerToken, port: resolvePort() })

    const shutdown = async (): Promise<void> => {
        const timeout = setTimeout(() => {
            logger.warn('Graceful shutdown timed out, forcing exit')
            process.exit(1)
        }, 30_000)
        await executorServer.stop()
        clearTimeout(timeout)
        process.exit(0)
    }
    process.on('SIGINT', () => void shutdown())
    process.on('SIGTERM', () => void shutdown())
}

function resolvePort(): number {
    const raw = process.env['PORT'] ?? system.get(WorkerSystemProp.PORT)
    return Number(raw)
}

main().catch((err) => {
    logger.error({ error: err }, 'Executor crashed')
    process.exit(1)
})
