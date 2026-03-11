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

    await migrateQueuesAndRunConsumers(app)

    const workerToken = await accessTokenManager(app.log).generateWorkerToken()

    return { app, workerToken, apiUrl }
}
