import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyInstance } from 'fastify'
import { flowEngineWorker } from './engine-controller'
import { workerMachineController } from './machine/machine-controller'
import { jobQueue } from './queue/job-queue'
import { jobQueueWorker } from './queue/job-queue-worker'
import { queueMigration } from './queue/migration'
import { setupBullMQBoard } from './queue/redis-bullboard'
import { flowWorkerController } from './worker-controller'
import { QueueName } from '@activepieces/server-shared'
import { apId, WorkerJobType, LATEST_JOB_DATA_SCHEMA_VERSION, RunEnvironment } from '@activepieces/shared'
import { JobType } from './queue/queue-manager'

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

    await setupBullMQBoard(app)
    await jobQueueWorker(app.log).init()


    setTimeout(async () => {
        console.log("Adding job to worker jobs queue")
        jobQueue(app.log).add({
            id: apId(),
            data: {
                platformId: 'platform_' + apId(),
                projectId: 'proj_' + apId(),
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                requestId: 'req_' + apId(),
                payload: { mockData: 'example payload' },
                jobType: WorkerJobType.EXECUTE_WEBHOOK,
                flowId: 'flow_' + apId(),
                saveSampleData: true,
                flowVersionIdToRun: 'ver_' + apId(),
                runEnvironment: RunEnvironment.TESTING,
                execute: true,
                parentRunId: 'parent_' + apId(),
                failParentOnFailure: false,
            },
            type: JobType.ONE_TIME,
        })



    }, 5000)

    setTimeout(async () => {

        jobQueue(app.log).add({
            id: apId(),
            data: {
                platformId: 'platform_' + apId(),
                projectId: 'proj_' + apId(),
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                requestId: 'req_' + apId(),
                payload: { mockData: 'example payload' },
                jobType: WorkerJobType.EXECUTE_WEBHOOK,
                flowId: 'flow_' + apId(),
                saveSampleData: true,
                flowVersionIdToRun: 'ver_' + apId(),
                runEnvironment: RunEnvironment.TESTING,
                execute: true,
                parentRunId: 'parent_' + apId(),
                failParentOnFailure: false,
            },
            type: JobType.ONE_TIME,
        })
    }, 10000)
}


// This should be called after the app is booted, to ensure no plugin timeout
export const migrateQueuesAndRunConsumers = async (app: FastifyInstance) => {
    await queueMigration(app.log).run()
    await jobQueueWorker(app.log).run()
}