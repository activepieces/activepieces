import { logger } from './config/logger'
import { selectRunner } from './runtime/runner-factory'
import { workerSystemSnapshot } from './utils/system-snapshot'

async function main(): Promise<void> {
    workerSystemSnapshot.start()
    const runner = selectRunner()
    await runner.start()

    const shutdown = async (): Promise<void> => {
        const timeout = setTimeout(() => {
            logger.warn('Graceful shutdown timed out, forcing exit')
            process.exit(1)
        }, 30_000)
        await runner.stop()
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
