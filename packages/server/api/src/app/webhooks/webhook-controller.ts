import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import {
    ALL_PRINCIPAL_TYPES,
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    EventPayload,
    Flow,
    FlowId,
    FlowStatus,
    WebhookUrlParams,
} from '@activepieces/shared'
import { webhookService } from './webhook-service'
import { isNil } from '@activepieces/shared'
import { flowRepo } from '../flows/flow/flow.repo'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { getEdition } from '../helper/secret-helper'
import { flowResponseWatcher } from '../flows/flow-run/flow-response-watcher'
import { flowService } from '../flows/flow/flow.service'
import { exceptionHandler, logger } from 'server-shared'
import { tasksLimit } from '../ee/project-plan/tasks-limit'

export const webhookController: FastifyPluginAsyncTypebox = async (app) => {
    app.all(
        '/:flowId/sync',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, false, reply)
            if (isHandshake) {
                return
            }
            const run = (
                await webhookService.callback({
                    flow,
                    synchronousHandlerId: flowResponseWatcher.getHandlerId(),
                    payload: {
                        method: request.method,
                        headers: request.headers as Record<string, string>,
                        body: await convertBody(request),
                        queryParams: request.query as Record<string, string>,
                    },
                })
            )[0]
            if (isNil(run)) {
                await reply.status(StatusCodes.NOT_FOUND).send()
                return
            }
            const response = await flowResponseWatcher.listen(run.id, true)
            await reply
                .status(response.status)
                .headers(response.headers)
                .send(response.body)
        },
    )

    app.all(
        '/:flowId',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, false, reply)
            if (isHandshake) {
                return
            }
            asyncHandler(payload, flow).catch(exceptionHandler.handle)
            await reply.status(StatusCodes.OK).headers({}).send({})
        },
    )

    app.all(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: WebhookUrlParams,
            },
        },
        async (
            request: FastifyRequest<{ Querystring: WebhookUrlParams }>,
            reply,
        ) => {
            const flow = await getFlowOrThrow(request.query.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, false, reply)
            if (isHandshake) {
                return
            }
            asyncHandler(payload, flow).catch(exceptionHandler.handle)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/:flowId/simulate',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            logger.debug(
                `[WebhookController#simulate] flowId=${request.params.flowId}`,
            )
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, true, reply)
            if (isHandshake) {
                return
            }
            await webhookService.simulationCallback({
                flow,
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

async function convertRequest(request: FastifyRequest): Promise<EventPayload> {
    const payload: EventPayload = {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request),
        queryParams: request.query as Record<string, string>,
    }
    return payload
}

const convertBody = async (request: FastifyRequest): Promise<unknown> => {
    if (request.isMultipart()) {
        const jsonResult: Record<string, unknown> = {}
        const requestBodyEntries = Object.entries(
            request.body as Record<string, unknown>,
        )

        for (const [key, value] of requestBodyEntries) {
            jsonResult[key] =
        value instanceof Buffer ? value.toString('base64') : value
        }

        logger.debug({ name: 'WebhookController#convertBody', jsonResult })

        return jsonResult
    }
    return request.body
}

async function handshakeHandler(
    flow: Flow,
    payload: EventPayload,
    simulate: boolean,
    reply: FastifyReply,
): Promise<boolean> {
    const handshakeResponse = await webhookService.handshake({
        flow,
        payload,
        simulate,
    })
    if (!isNil(handshakeResponse)) {
        reply = reply.status(handshakeResponse.status)
        if (handshakeResponse.headers !== undefined) {
            for (const header of Object.keys(handshakeResponse.headers)) {
                reply = reply.header(
                    header,
                    handshakeResponse.headers[header] as string,
                )
            }
        }
        await reply.send(handshakeResponse.body)
        return true
    }
    return false
}

const asyncHandler = async (payload: EventPayload, flow: Flow) => {
    return webhookService.callback({
        flow,
        payload,
    })
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

    const flow = await flowRepo().findOneBy({ id: flowId })

    if (isNil(flow)) {
        logger.error(
            `[WebhookService#getFlowOrThrow] error=flow_not_found flowId=${flowId}`,
        )

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    // TODO FIX AND REFACTOR
    // BEGIN EE
    const edition = getEdition()
    if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        try {
            await tasksLimit.limit({
                projectId: flow.projectId,
            })
        }
        catch (e) {
            if (
                e instanceof ActivepiecesError &&
        e.error.code === ErrorCode.QUOTA_EXCEEDED
            ) {
                logger.info(
                    `[webhookController] removing flow.id=${flow.id} run out of flow quota`,
                )
                await flowService.updateStatus({
                    id: flow.id,
                    projectId: flow.projectId,
                    newStatus: FlowStatus.DISABLED,
                })
            }
            throw e
        }
    }
    // END EE

    return flow
}
