import { ALL_PRINCIPAL_TYPES, GetSystemHealthChecksResponse, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
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
            const isHealthy = healthStatusService(app.log).isHealthy()
            if (!isHealthy) {
                await reply.status(StatusCodes.SERVICE_UNAVAILABLE).send({ status: 'Unhealthy' })
                return
            }
            await reply.status(StatusCodes.OK).send({ status: 'Healthy' })
        },
    ),
    app.get('/system', GetSystemHealthChecks, async (request, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        await reply.status(StatusCodes.OK).send(await healthStatusService(app.log).getSystemHealthChecks())
    })
}

const GetSystemHealthChecks = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    response: {
        200: {
            description: 'System health checks',
            type: GetSystemHealthChecksResponse,
        },
    },
}