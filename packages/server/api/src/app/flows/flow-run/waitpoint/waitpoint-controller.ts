import { spreadIfDefined } from '@activepieces/core-utils'
import { ApId, CreateWaitpointRequest, CreateWaitpointResponse, SealFanInBarrierRequest, SealFanInBarrierResponse } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { domainHelper } from '../../../helper/domain-helper'
import { waitpointService } from './waitpoint-service'
import { WaitpointStatus } from './waitpoint-types'

export const waitpointController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateWaitpointParams, async (request, reply) => {
        const { flowRunId, projectId, stepName, type, version, resumeDateTime, responseToSend, workerHandlerId, httpRequestId, isFanIn, intendedChildren, dispatchDigest } = request.body
        const { waitpoint, fanIn } = await waitpointService(request.log).createForPause({
            flowRunId,
            projectId,
            stepName,
            type,
            version,
            resumeDateTime,
            responseToSend: responseToSend ?? undefined,
            workerHandlerId: workerHandlerId ?? undefined,
            httpRequestId: httpRequestId ?? undefined,
            isFanIn,
            intendedChildren,
            dispatchDigest,
        })
        const resumeUrl = await domainHelper.getPublicApiUrl({
            path: `v1/flow-runs/${flowRunId}/waitpoints/${waitpoint.id}`,
        })
        return reply.status(StatusCodes.CREATED).send({
            id: waitpoint.id,
            resumeUrl,
            ...spreadIfDefined('fanIn', fanIn),
        })
    })

    app.post('/:id/seal', SealFanInBarrierParams, async (request) => {
        const { projectId, expectedChildren, failedToDispatch, timeoutAt } = request.body
        const { waitpoint, alreadySealed, timeoutAt: effectiveTimeoutAt } = await waitpointService(request.log).sealFanInBarrier({
            waitpointId: request.params.id,
            projectId,
            expectedChildren,
            failedToDispatch,
            timeoutAt,
        })
        return {
            expectedChildren: waitpoint.expectedChildren ?? expectedChildren,
            alreadySealed,
            released: waitpoint.status === WaitpointStatus.COMPLETED,
            timeoutAt: effectiveTimeoutAt,
        }
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

const SealFanInBarrierParams = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
        body: SealFanInBarrierRequest,
        response: {
            [StatusCodes.OK]: SealFanInBarrierResponse,
        },
    },
}
