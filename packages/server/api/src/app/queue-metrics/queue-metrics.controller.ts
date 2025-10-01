import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import { queueMetricService } from "./queue-metrics.service"
import { PrincipalType, QueueMetricsResponse, SERVICE_KEY_SECURITY_OPENAPI } from "@activepieces/shared"
import { platformMustBeOwnedByCurrentUser } from "../ee/authentication/ee-authorization"
import { StatusCodes } from "http-status-codes"

export const queueMetricsController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    app.get('/', GetMetrics, async (request) => queueMetricService(request.log).getMetrics())
}

const GetMetrics = {
    schema: {},
    config: {
        tags: ['queue-metrics'],
        description: 'Get metrics',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
        response: {
            [StatusCodes.OK]: QueueMetricsResponse,
        },
    },
}
