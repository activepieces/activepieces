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
    const app = await setupTestEnvironment({ fresh: true })

    await app.listen({ port: 0, host: '127.0.0.1' })
    const addr = app.server.address()
    const port = typeof addr === 'object' && addr !== null ? addr.port : 0
    const apiUrl = `http://127.0.0.1:${port}`

    await migrateQueuesAndRunConsumers(app)

    process.env.AP_API_URL = apiUrl

    const workerToken = await accessTokenManager(app.log).generateWorkerToken()

    return { app, workerToken, apiUrl }
}
