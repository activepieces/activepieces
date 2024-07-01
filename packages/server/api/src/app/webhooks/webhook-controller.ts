import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { tasksLimit } from '../ee/project-plan/tasks-limit'
import { webhookResponseWatcher } from '../flow-worker/helper/webhook-response-watcher'
import { flowQueue } from '../flow-worker/queue'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowService } from '../flows/flow/flow.service'
import { JobType, LATEST_JOB_DATA_SCHEMA_VERSION, logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    apId,
    EngineHttpResponse,
    ErrorCode,
    EventPayload,
    Flow,
    FlowId,
    FlowStatus,
    isNil,
    WebhookUrlParams,
} from '@activepieces/shared'

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
    await flowQueue.add(null, {
        id: requestId,
        type: JobType.WEBHOOK,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            requestId,
            synchronousHandlerId: async ? null : webhookResponseWatcher.getServerId(),
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

    const exceededLimit = await tasksLimit.exceededLimit({
        projectId: flow.projectId,
    })
    if (exceededLimit) {
        logger.info({
            message: 'disable webhook out of flow quota',
            projectId: flow.projectId,
            flowId: flow.id,
        })
        await flowService.updateStatus({
            id: flow.id,
            projectId: flow.projectId,
            newStatus: FlowStatus.DISABLED,
        })
    }

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