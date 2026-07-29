import { FanOutBranchesRequest, FanOutBranchesResponse } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { branchFanOutService } from './branch-fan-out-service'

export const branchFanOutController: FastifyPluginAsyncZod = async (app) => {
    app.post('/branches', FanOutBranchesParams, async (request, reply) => {
        const { flowRunId, stepName, itemCount } = request.body
        const result = await branchFanOutService(request.log).fanOut({ flowRunId, stepName, itemCount })
        return reply.status(StatusCodes.CREATED).send(result)
    })
}

const FanOutBranchesParams = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: FanOutBranchesRequest,
        response: {
            [StatusCodes.CREATED]: FanOutBranchesResponse,
        },
    },
}
