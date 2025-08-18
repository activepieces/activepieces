import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { testTriggerController } from './test-trigger/test-trigger-controller'
import { triggerEventController } from './trigger-events/trigger-event-controller'
import { triggerRunController } from './trigger-run/trigger-run.controller'

export const triggerModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(testTriggerController, { prefix: '/v1/test-trigger' })
    await app.register(triggerEventController, { prefix: '/v1/trigger-events' })
    await app.register(triggerRunController, { prefix: '/v1/trigger-runs' })
}
