import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowConsumer } from './consumer'
import { flowEngineWorker } from './engine-controller'
import { flowQueue } from './queue'
import { setupBullMQBoard } from './redis/redis-bullboard'
import { flowWorkerController } from './worker-controller'
import { flowWorker } from 'server-worker'

export const workerModule: (workerToken: string) => FastifyPluginAsyncTypebox = (workerToken) => async (app) => {
    await app.register(flowWorkerController, {
        prefix: '/v1/workers',
    })
    await app.register(flowEngineWorker, {
        prefix: '/v1/engine',
    })
    await flowQueue.init()
    await flowConsumer.init()
    await setupBullMQBoard(app)
    await flowWorker.init(workerToken)
}

