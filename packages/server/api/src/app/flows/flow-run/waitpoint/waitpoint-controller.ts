import { CreateWaitpointRequest, CreateWaitpointResponse } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { system } from '../../../helper/system/system'
import { WorkerSystemProp } from '../../../helper/system/system-props'
import { waitpointService } from './waitpoint-service'
import { WaitpointType } from './waitpoint-types'

export const waitpointController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateWaitpointParams, async (request, reply) => {
        const { flowRunId, projectId, type, resumeDateTime, responseToSend, workerHandlerId, httpRequestId } = request.body
        const { waitpoint } = await waitpointService(request.log).createForPause({
            flowRunId,
            projectId,
            type: type === 'DELAY' ? WaitpointType.DELAY : WaitpointType.WEBHOOK,
            resumeDateTime,
            responseToSend: responseToSend ?? undefined,
            workerHandlerId: workerHandlerId ?? undefined,
            httpRequestId: httpRequestId ?? undefined,
        })
        const frontendUrl = system.getOrThrow(WorkerSystemProp.FRONTEND_URL)
        const resumeUrl = `${frontendUrl}api/v1/flow-runs/${flowRunId}/resume`
        return reply.status(StatusCodes.CREATED).send({
            id: waitpoint.id,
            resumeUrl,
        })
    })
}

const CreateWaitpointParams = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: CreateWaitpointRequest,
        response: {
            [StatusCodes.CREATED]: CreateWaitpointResponse,
        },
    },
}
