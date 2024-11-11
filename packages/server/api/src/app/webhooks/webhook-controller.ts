import {
    JobType,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    logger,
} from '@activepieces/server-shared'
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
    GetFlowVersionForWorkerRequestType,
    isMultipartFile,
    isNil,
    WebhookUrlParams,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { tasksLimit } from '../ee/project-plan/tasks-limit'
import { stepFileService } from '../file/step-file/step-file.service'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowService } from '../flows/flow/flow.service'
import { webhookResponseWatcher } from '../workers/helper/webhook-response-watcher'
import { flowQueue } from '../workers/queue'
import { getJobPriority } from '../workers/queue/queue-manager'
import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'

export const webhookController: FastifyPluginAsyncTypebox = async (app) => {
    app.all(
        '/:flowId/sync',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const response = await handleWebhook({
                request,
                flowId: request.params.flowId,
                async: false,
                flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
                saveSampleData: await webhookSimulationService.exists(
                    request.params.flowId,
                ),
            })
            await reply
                .status(response.status)
                .headers(response.headers)
                .send(response.body)
        },
    )

    app.all(
        '/:flowId',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const response = await handleWebhook({
                request,
                flowId: request.params.flowId,
                async: true,
                saveSampleData: await webhookSimulationService.exists(
                    request.params.flowId,
                ),
                flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
            })
            await reply
                .status(response.status)
                .headers(response.headers)
                .send(response.body)
        },
    )

    app.all('/:flowId/draft/sync', WEBHOOK_PARAMS, async (request, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.params.flowId,
            async: false,
            saveSampleData: true,
            flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    })

    app.all('/:flowId/draft', WEBHOOK_PARAMS, async (request, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.params.flowId,
            async: true,
            saveSampleData: true,
            flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST,
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
            saveSampleData: true,
            flowVersionToRun: undefined,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    })

    // @deprecated this format was changed in early 2023 to include flowId in the path
    app.all('/', WEBHOOK_QUERY_PARAMS, async (request, reply) => {
        const response = await handleWebhook({
            request,
            flowId: request.query.flowId,
            async: true,
            saveSampleData: true,
            flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
        })
        await reply
            .status(response.status)
            .headers(response.headers)
            .send(response.body)
    })
}

async function handleWebhook({
    request,
    flowId,
    async,
    saveSampleData,
    flowVersionToRun,
}: {
    request: FastifyRequest
    flowId: string
    async: boolean
    saveSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined
}): Promise<EngineHttpResponse> {
    const flow = await getFlowOrThrow(flowId)
    const payload = await convertRequest(request, flow.projectId, flow.id)
    const requestId = apId()
    const synchronousHandlerId = async
        ? null
        : webhookResponseWatcher.getServerId()
    if (isNil(flow)) {
        return {
            status: StatusCodes.GONE,
            body: {},
            headers: {},
        }
    }
    if (
        flow.status !== FlowStatus.ENABLED &&
    !saveSampleData &&
    flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED
    ) {
        return {
            status: StatusCodes.NOT_FOUND,
            body: {},
            headers: {},
        }
    }
    await flowQueue.add({
        id: requestId,
        type: JobType.WEBHOOK,
        data: {
            projectId: flow.projectId,
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            requestId,
            synchronousHandlerId,
            payload,
            flowId: flow.id,
            saveSampleData,
            flowVersionToRun,
        },
        priority: await getJobPriority(flow.projectId, synchronousHandlerId),
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

async function convertRequest(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<EventPayload> {
    const payload: EventPayload = {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, projectId, flowId),
        queryParams: request.query as Record<string, string>,
    }
    return payload
}

const convertBody = async (
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<unknown> => {
    if (request.isMultipart()) {
        const jsonResult: Record<string, unknown> = {}
        const requestBodyEntries = Object.entries(
            request.body as Record<string, unknown>,
        )

        for (const [key, value] of requestBodyEntries) {
            if (isMultipartFile(value)) {
                const file = await stepFileService.saveAndEnrich(
                    {
                        file: value.data as Buffer,
                        fileName: value.filename,
                        stepName: 'trigger',
                        flowId,
                    },
                    request.hostname,
                    projectId,
                )
                jsonResult[key] = file.url
            }
            else {
                jsonResult[key] = value
            }
        }
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
