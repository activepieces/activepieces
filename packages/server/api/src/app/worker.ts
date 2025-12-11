import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { devPiecesBuilder, flowWorker } from 'server-worker'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { healthStatusService } from './health/health.service'
import { system } from './helper/system/system'

export const setupWorker = async (app: FastifyInstance): Promise<void> => {

    const devPieces = system.get(AppSystemProp.DEV_PIECES)?.split(',') ?? []
    await devPiecesBuilder(app, app.io, devPieces)
    
    app.addHook('onClose', async () => {
        await flowWorker(app.log).close()
    })
}

export async function workerPostBoot(app: FastifyInstance): Promise<void> {
    const workerToken = await generateWorkerToken()
    await flowWorker(app.log).init({ workerToken, markAsHealthy: async () => healthStatusService(app.log).markWorkerHealthy() })
}



async function generateWorkerToken(): Promise<string> {
    const workerToken = system.get(WorkerSystemProp.WORKER_TOKEN)
    if (!isNil(workerToken)) {
        return workerToken
    }
    return accessTokenManager.generateWorkerToken()
}