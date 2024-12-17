import { PiecesSource, WorkerSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { flowWorker, piecesBuilder } from 'server-worker'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { system } from './helper/system/system'
import { AppSystemProp } from './helper/system/system-prop'

export const setupWorker = async (app: FastifyInstance): Promise<void> => {

    const piecesSource = system.getOrThrow<PiecesSource>(AppSystemProp.PIECES_SOURCE)
    const devPieces = system.get(AppSystemProp.DEV_PIECES)?.split(',') ?? []
    await piecesBuilder(app, app.io, devPieces, piecesSource)

    app.addHook('onClose', async () => {
        await flowWorker(app.log).close()
    })
}

export async function workerPostBoot(app: FastifyInstance): Promise<void> {
    const workerToken = await generateWorkerToken()
    await flowWorker(app.log).init(workerToken)


    await flowWorker(app.log).start()
}



async function generateWorkerToken(): Promise<string> {
    const workerToken = system.get(WorkerSystemProp.WORKER_TOKEN)
    if (!isNil(workerToken)) {
        return workerToken
    }
    return accessTokenManager.generateWorkerToken()
}