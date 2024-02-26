import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { activityController } from './activity-controller'
import { activityWorkerController } from './activity-worker-controller'

export const activityModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(activityController, { prefix: '/v1/activities' })
    await app.register(activityWorkerController, { prefix: '/v1/worker/activities' })
}
