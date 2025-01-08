import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowConsumer } from './consumer'
import { flowEngineWorker } from './engine-controller'
import { workerMachineController } from './machine/machine-controller'
import { jobQueue } from './queue'
import { setupBullMQBoard } from './redis/redis-bullboard'
import { flowWorkerController } from './worker-controller'

export const workerModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowWorkerController, {
        prefix: '/v1/workers',
    })
    await app.register(flowEngineWorker, {
        prefix: '/v1/engine',
    })
    await app.register(workerMachineController, {
        prefix: '/v1/worker-machines',
    })
    await jobQueue(app.log).init()
    await flowConsumer(app.log).init()
    await setupBullMQBoard(app)
}

