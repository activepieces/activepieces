import { FastifyInstance } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { runsMetadataQueue } from '../flows/flow-run/flow-runs-queue'
import { pubsub } from '../helper/pubsub'
import { flowEngineWorker } from './engine-controller'
import { setupBullMQBoard } from './job-queue/bullboard'
import { jobBroker } from './job-queue/job-broker'
import { jobQueue } from './job-queue/job-queue'
import { workerMachineController } from './machine/machine-controller'
import { queueMigration } from './migrations/queue-migration-runner'
export const workerModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(flowEngineWorker, {
        prefix: '/v1/engine',
    })
    await app.register(workerMachineController, {
        prefix: '/v1/worker-machines',
    })
    await jobQueue(app.log).init()

    await runsMetadataQueue(app.log).init()

    await setupBullMQBoard(app)

    app.addHook('onClose', async () => {
        await jobBroker(app.log).close()
        await runsMetadataQueue(app.log).close()
        await jobQueue(app.log).close()
        await pubsub.close()
    })
}


// This should be called after the app is booted, to ensure no plugin timeout
export const migrateQueuesAndRunConsumers = async (app: FastifyInstance) => {
    await queueMigration(app.log).run()
    await jobBroker(app.log).init()
}
