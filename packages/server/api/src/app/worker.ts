import { isNil, WorkerMachineType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { flowWorker, piecesBuilder } from 'server-worker'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { WorkerSystemProps } from './helper/system/system-prop'
import { system } from './helper/system/system'


export const setupWorker = async (app: FastifyInstance): Promise<void> => {

    const workerToken = await generateWorkerToken()
    await flowWorker(app.log).init(workerToken)
    app.addHook('onClose', async () => {
        await flowWorker(app.log).close()
    })
    await piecesBuilder(app, app.io)
}

export async function workerPostBoot(app: FastifyInstance): Promise<void> {
    await flowWorker(app.log).start()
}



async function generateWorkerToken(): Promise<string> {
    const workerToken = system.get(WorkerSystemProps.WORKER_TOKEN)
    if (!isNil(workerToken)) {
        return workerToken
    }
    return accessTokenManager.generateWorkerToken({
        type: WorkerMachineType.SHARED,
        platformId: null,
    })
}