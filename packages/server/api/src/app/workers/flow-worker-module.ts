import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowConsumer } from './consumer'
import { flowWorker } from './flow-worker'
import { flowQueue } from './queue'
import { setupBullMQBoard } from './redis/redis-bullboard'

export const flowWorkerModule: FastifyPluginAsyncTypebox = async (app): Promise<void> => {
    await flowQueue.init()
    await flowConsumer.init()
    await flowWorker.init()
    await setupBullMQBoard(app)
}

