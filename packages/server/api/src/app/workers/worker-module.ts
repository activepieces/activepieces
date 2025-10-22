import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyInstance } from 'fastify'
import { runsMetadataQueue } from '../flows/flow-run/flow-runs-queue'
import { flowEngineWorker } from './engine-controller'
import { workerMachineController } from './machine/machine-controller'
import { jobQueue } from './queue/job-queue'
import { queueMigration } from './queue/migration'
import { setupBullMQBoard } from './queue/redis-bullboard'
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
    await runsMetadataQueue(app.log).init()
    await setupBullMQBoard(app)
}


// This should be called after the app is booted, to ensure no plugin timeout
export const migrateQueuesAndRunConsumers = async (app: FastifyInstance) => {
    await queueMigration(app.log).run()
}