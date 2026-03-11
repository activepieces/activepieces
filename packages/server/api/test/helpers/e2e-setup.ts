import { FastifyInstance } from 'fastify'
import { setupTestEnvironment } from './test-setup'
import { migrateQueuesAndRunConsumers } from '../../src/app/workers/worker-module'
import { accessTokenManager } from '../../src/app/authentication/lib/access-token-manager'

export type E2eContext = {
    app: FastifyInstance
    workerToken: string
    apiUrl: string
}

export async function setupE2eEnvironment(): Promise<E2eContext> {
    const apiUrl = 'http://127.0.0.1:3000'

    // Override before server setup so publicApiUrl / generateResumeUrl resolve to the
    // test server, not the default AP_FRONTEND_URL (localhost:4200).
    process.env.AP_FRONTEND_URL = apiUrl
    process.env.AP_API_URL = apiUrl

    const app = await setupTestEnvironment({ fresh: true })

    // Listen on port 3000 — the worker's getApiUrl() returns http://127.0.0.1:3000/
    // for WORKER_AND_APP container type, which is used as internalApiUrl for engine RPC.
    await app.listen({ port: 3000, host: '127.0.0.1' })

    // In production, nginx strips the /api/ prefix. In tests there's no proxy,
    // so intercept at the raw HTTP level and rewrite /api/* → /* before Fastify routes.
    const httpServer = app.server
    const originalListeners = httpServer.listeners('request').slice()
    httpServer.removeAllListeners('request')
    httpServer.on('request', (req, res) => {
        if (req.url?.startsWith('/api/')) {
            req.url = req.url.substring(4)
        }
        for (const listener of originalListeners) {
            (listener as (req: unknown, res: unknown) => void)(req, res)
        }
    })

    await migrateQueuesAndRunConsumers(app)

    const workerToken = await accessTokenManager(app.log).generateWorkerToken()

    return { app, workerToken, apiUrl }
}
