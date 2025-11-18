import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { healthStatusService } from './health.service'

export const healthModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(healthController, { prefix: '/v1/health' })
}

const healthController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
        },
        async (_request, reply) => {
            const isHealthy = healthStatusService.isHealthy()
            if (!isHealthy) {
                await reply.status(StatusCodes.SERVICE_UNAVAILABLE).send({ status: 'Unhealthy' })
                return
            }
            await reply.status(StatusCodes.OK).send({ status: 'Healthy' })
        },
    )
}
