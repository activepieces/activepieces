import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { logger } from '@activepieces/server-shared'
import { apId, PrincipalType } from '@activepieces/shared'
import { flowWorker } from 'server-worker'


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



async function generateWorkerToken() {
    return accessTokenManager.generateToken({
        id: apId(),
        type: PrincipalType.WORKER,
        projectId: apId(),
        platform: {
            id: apId(),
        },
    }, dayjs.duration(10, 'year').asSeconds())
}