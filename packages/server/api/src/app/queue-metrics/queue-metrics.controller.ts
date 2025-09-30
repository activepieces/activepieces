import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import { queueMetricService } from "./queue-metrics.service"
import { ALL_PRINCIPAL_TYPES, ListQueueJobsRequestQuery } from "@activepieces/shared"

export const queueMetricsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', GetJobs, async (request) => {
        return queueMetricService(request.log).getMetrics()
    })
}

const GetJobs = {
    schema: {
       querystring : ListQueueJobsRequestQuery,
    },
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}
