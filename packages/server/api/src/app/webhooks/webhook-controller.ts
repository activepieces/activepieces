import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { tasksLimit } from '../ee/project-plan/tasks-limit'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowService } from '../flows/flow/flow.service'
import { getEdition } from '../helper/secret-helper'
import { flowQueue } from '../workers/flow-worker/flow-queue'
import { JobType } from '../workers/flow-worker/queues/queue'
import { EngineHttpResponse, webhookResponseWatcher } from '../workers/flow-worker/webhook-response-watcher'
import { logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    apId,
    ErrorCode,
    EventPayload,
    Flow,
    FlowId,
    FlowStatus,
    isNil,
    WebhookUrlParams,
} from '@activepieces/shared'
import { LATEST_JOB_DATA_SCHEMA_VERSION } from 'server-worker'

export const webhookController: FastifyPluginAsyncTypebox = async (app) => {

    app.all('/:flowId/sync', WEBHOOK_PARAMS, async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.params.flowId,
            async: false,
            simulate: false,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    })

    app.all('/:flowId', WEBHOOK_PARAMS, async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.params.flowId,
            async: true,
            simulate: false,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    })

    app.all('/', WEBHOOK_QUERY_PARAMS, async (request, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.query.flowId,
            async: true,
            simulate: false,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    })

    app.all('/:flowId/test', WEBHOOK_PARAMS, async (request, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.params.flowId,
            async: true,
            simulate: true,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    },
    )
}

async function handleWebhook({ request, flowId, async, simulate }: { request: FastifyRequest, flowId: string, async: boolean, simulate: boolean }): Promise<EngineHttpResponse> {
    const flow = await getFlowOrThrow(flowId)
    const payload = await convertRequest(request)
    const requestId = apId()
    await flowQueue.add({
        id: requestId,
        type: JobType.WEBHOOK,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            requestId,
            synchronousHandlerId: async ? null : webhookResponseWatcher.getHandlerId(),
            payload,
            flowId: flow.id,
            simulate,
        },
        priority: async ? 'medium' : 'high',
    })
    if (async) {
        return {
            status: StatusCodes.OK,
            body: {},
            headers: {},
        }
    }
    return webhookResponseWatcher.oneTimeListener(requestId, true)
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

const WEBHOOK_PARAMS = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        skipAuth: true,
    },
    schema: {
        params: WebhookUrlParams,
    },
}

const WEBHOOK_QUERY_PARAMS = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        skipAuth: true,
    },
    schema: {
        querystring: WebhookUrlParams,
    },
}