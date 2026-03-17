import { createServer } from 'http'
import { getApiUrl, getSocketUrl, system, WorkerSystemProp } from './config/configs'
import { logger } from './config/logger'
import { worker } from './worker'

const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)

async function main(): Promise<void> {
    const healthServer = startHealthServer()
    await worker.start({ apiUrl: getApiUrl(), socketUrl: getSocketUrl(), workerToken })

    const shutdown = async () => {
        const timeout = setTimeout(() => {
            logger.warn('Graceful shutdown timed out, forcing exit')
            process.exit(1)
        }, 30_000)
        await worker.stop()
        healthServer?.close()
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

function startHealthServer(): ReturnType<typeof createServer> | null {
    const containerType = system.get(WorkerSystemProp.CONTAINER_TYPE) ?? 'WORKER_AND_APP'
    if (containerType === 'WORKER_AND_APP') return null

    const port = Number(system.get(WorkerSystemProp.PORT))
    const server = createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/worker/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: 'ok' }))
        }
        else {
            res.writeHead(404)
            res.end()
        }
    })
    server.listen(port, () => {
        logger.info({ port }, 'Health server listening')
    })
    return server
}
