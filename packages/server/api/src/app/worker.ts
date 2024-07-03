import { logger, system, WorkerSystemProps } from '@activepieces/server-shared'
import { apId, isNil, PrincipalType } from '@activepieces/shared'
import dayjs from 'dayjs'
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
    return accessTokenManager.generateToken({
        id: apId(),
        type: PrincipalType.WORKER,
        projectId: apId(),
        platform: {
            id: apId(),
        },
    }, dayjs.duration(10, 'year').asSeconds())
}