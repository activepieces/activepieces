import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { queueMetricsController } from './queue-metrics.controller'

export const queueMetricsModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(queueMetricsController, { prefix: '/v1/queue-metrics' })

}
