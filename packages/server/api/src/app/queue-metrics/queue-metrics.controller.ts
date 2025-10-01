import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import { queueMetricService } from "./queue-metrics.service"
import { ALL_PRINCIPAL_TYPES, PrincipalType } from "@activepieces/shared"

export const queueMetricsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', GetMetrics, async (request) => {
        return queueMetricService(request.log).getMetrics()
    })
}

const GetMetrics = {
    schema: { },
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}
