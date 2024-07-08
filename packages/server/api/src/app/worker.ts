import { logger, system, WorkerSystemProps } from '@activepieces/server-shared'
import { isNil, WorkerMachineType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { flowWorker } from 'server-worker'
import { accessTokenManager } from './authentication/lib/access-token-manager'


export const setupWorker = async (app: FastifyInstance): Promise<void> => {

    const workerToken = await generateWorkerToken()
    await flowWorker.init(workerToken)

    app.addHook('onClose', async () => {
        await flowWorker.close()
    })

}
export async function workerPostBoot(): Promise<void> {
    logger.info('Worker started')
    await flowWorker.start()
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