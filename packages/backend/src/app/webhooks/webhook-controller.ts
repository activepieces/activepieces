import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ErrorCode, Flow, FlowId, WebhookUrlParams } from '@activepieces/shared'
import { webhookService } from './webhook-service'
import { captureException, logger } from '../helper/logger'
import { isNil } from 'lodash'
import { flowRepo } from '../flows/flow/flow.repo'

export const webhookController: FastifyPluginAsync = async (app) => {
    app.all(
        '/:flowId',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.params.flowId)
            handler(request, flow)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/',
        {
            schema: {
                querystring: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Querystring: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.query.flowId)
            handler(request, flow)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/:flowId/simulate',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            logger.debug(`[WebhookController#simulate] flowId=${request.params.flowId}`)
            const flow = await getFlowOrThrow(request.params.flowId)
            await webhookService.simulationCallback({
                flow: flow,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: await convertBody(request),
                    queryParams: request.query as Record<string, string>,
                },
            })

            await reply.status(StatusCodes.OK).send()
        },
    )
}

const convertBody = async (request: FastifyRequest) => {
    if(request.isMultipart()){
        const jsonResult: Record<string, unknown> = {}
        const parts = request.parts()
        for await (const part of parts) {
            // TODO: support files
            if (part.type === 'file') {
                const chunks = []
                for await (const chunk of part.file) {
                    chunks.push(chunk)
                }
                const fileBuffer = Buffer.concat(chunks)
                jsonResult[part.fieldname] = fileBuffer.toString('base64')
            }
            else {
                jsonResult[part.fieldname] = part.value
            }
        }
        return jsonResult
    }
    return request.body

}
const handler = async (request: FastifyRequest, flow: Flow) => {
    // If we don't catch the error here, it will crash the Fastify API. Adding await before the function call can help, but since 3P services expect a fast response, we still don't want to wait for the callback to finish.
    try {
        await webhookService.callback({
            flow: flow,
            payload: {
                method: request.method,
                headers: request.headers as Record<string, string>,
                body: await convertBody(request),
                queryParams: request.query as Record<string, string>,
            },
        })
    }
    catch (e) {
        captureException(e)
    }
}

const getFlowOrThrow = async (flowId: FlowId): Promise<Flow> => {
    if (isNil(flowId)) {
        logger.error('[WebhookService#getFlowOrThrow] error=flow_id_is_undefined')
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'flowId is undefined',
            },
        })
    }

    const flow = await flowRepo.findOneBy({ id: flowId })

    if (isNil(flow)) {
        logger.error(`[WebhookService#getFlowOrThrow] error=flow_not_found flowId=${flowId}`)

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    return flow
}
