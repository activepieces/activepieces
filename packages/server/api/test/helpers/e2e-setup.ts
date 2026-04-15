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
    // Use port 0 so the OS assigns a free port, avoiding EADDRINUSE in parallel test runs.
    const app = await setupTestEnvironment({ fresh: true })
    await app.listen({ port: 0, host: '127.0.0.1' })

    const address = app.server.address()
    const port = typeof address === 'object' && address !== null ? address.port : 3000
    const apiUrl = `http://127.0.0.1:${port}`

    process.env.AP_FRONTEND_URL = apiUrl
    process.env.AP_API_URL = apiUrl
    process.env.AP_PORT = String(port)

    await migrateQueuesAndRunConsumers(app)

    const workerToken = await accessTokenManager(app.log).generateWorkerToken()

    return { app, workerToken, apiUrl }
}
