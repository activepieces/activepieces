import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { queueMetricsController } from './queue-metrics.controller'

export const queueMetricsModule: FastifyPluginAsyncZod = async (fastify) => {
    await fastify.register(queueMetricsController, { prefix: '/v1/queue-metrics' })

}
