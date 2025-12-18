
import {
    ALL_PRINCIPAL_TYPES,
    EventPayload,
    FAIL_PARENT_ON_FAILURE_HEADER,
    FlowRun,
    isMultipartFile,
    PARENT_RUN_ID_HEADER,
    WebhookUrlParams,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { trace } from '@opentelemetry/api'
import { FastifyRequest, HTTPMethods } from 'fastify'
import { stepFileService } from '../file/step-file/step-file.service'
import { projectService } from '../project/project-service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { WebhookFlowVersionToRun } from './webhook-handler'
import { webhookService } from './webhook.service'

const tracer = trace.getTracer('webhook-controller')

const ALL_HTTP_METHODS: HTTPMethods[] = [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE',
    'PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE', 'LOCK', 'UNLOCK', 'REPORT',
] as HTTPMethods[]

export const webhookController: FastifyPluginAsyncTypebox = async (app) => {

    app.route({
        method: ALL_HTTP_METHODS,
        url: '/:flowId/sync',
        ...WEBHOOK_PARAMS,
        handler: async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            return tracer.startActiveSpan('webhook.receive.sync', {
                attributes: {
                    'webhook.flowId': request.params.flowId,
                    'webhook.method': request.method,
                    'webhook.type': 'sync',
                },
            }, async (span) => {
                try {
                    const response = await webhookService.handleWebhook({
                        data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                        logger: request.log,
                        flowId: request.params.flowId,
                        async: false,
                        flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                        saveSampleData: await triggerSourceService(request.log).existsByFlowId({
                            flowId: request.params.flowId,
                            simulate: true,
                        },
                        ),
                        execute: true,
                        ...extractHeaderFromRequest(request),
                    })
                    span.setAttribute('webhook.response.status', response.status)
                    await reply
                        .status(response.status)
                        .headers(response.headers)
                        .send(response.body)
                }
                finally {
                    span.end()
                }
            })
        },
    })

    app.route({
        method: ALL_HTTP_METHODS,
        url: '/:flowId',
        ...WEBHOOK_PARAMS,
        handler: async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            return tracer.startActiveSpan('webhook.receive.async', {
                attributes: {
                    'webhook.flowId': request.params.flowId,
                    'webhook.method': request.method,
                    'webhook.type': 'async',
                },
            }, async (span) => {
                try {
                    const response = await webhookService.handleWebhook({
                        data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                        logger: request.log,
                        flowId: request.params.flowId,
                        async: true,
                        saveSampleData: await triggerSourceService(request.log).existsByFlowId({
                            flowId: request.params.flowId,
                            simulate: true,
                        },
                        ),
                        flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                        execute: true,
                        ...extractHeaderFromRequest(request),
                    })
                    span.setAttribute('webhook.response.status', response.status)
                    await reply
                        .status(response.status)
                        .headers(response.headers)
                        .send(response.body)
                }
                finally {
                    span.end()
                }
            })
        },
    })

    app.route({
        method: ALL_HTTP_METHODS,
        url: '/:flowId/draft/sync',
        ...WEBHOOK_PARAMS,
        handler: async (request, reply) => {
            const response = await webhookService.handleWebhook({
                data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                logger: request.log,
                flowId: request.params.flowId,
                async: false,
                saveSampleData: true,
                flowVersionToRun: WebhookFlowVersionToRun.LATEST,
                execute: true,
                onRunCreated: (run) => {
                    app.io.to(run.projectId).emit(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, run)
                },
                ...extractHeaderFromRequest(request),
            })
            await reply
                .status(response.status)
                .headers(response.headers)
                .send(response.body)
        },
    })

    app.route({
        method: ALL_HTTP_METHODS,
        url: '/:flowId/draft',
        ...WEBHOOK_PARAMS,
        handler: async (request, reply) => {
            const response = await webhookService.handleWebhook({
                data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                logger: request.log,
                flowId: request.params.flowId,
                async: true,
                saveSampleData: true,
                flowVersionToRun: WebhookFlowVersionToRun.LATEST,
                execute: true,
                ...extractHeaderFromRequest(request),
            })
            await reply
                .status(response.status)
                .headers(response.headers)
                .send(response.body)
        },
    })

    app.route({
        method: ALL_HTTP_METHODS,
        url: '/:flowId/test',
        ...WEBHOOK_PARAMS,
        handler: async (request, reply) => {
            const response = await webhookService.handleWebhook({
                data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                logger: request.log,
                flowId: request.params.flowId,
                async: true,
                saveSampleData: true,
                flowVersionToRun: WebhookFlowVersionToRun.LATEST,
                execute: false,
                ...extractHeaderFromRequest(request),
            })
            await reply
                .status(response.status)
                .headers(response.headers)
                .send(response.body)
        },
    })

}


const WEBHOOK_PARAMS = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        skipAuth: true,
        rawBody: true,
    },
    schema: {
        params: WebhookUrlParams,
    },
}


async function convertRequest(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<EventPayload> {
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, projectId, flowId),
        queryParams: request.query as Record<string, string>,
        rawBody: request.rawBody,
    }
}



async function convertBody(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<unknown> {
    if (request.isMultipart()) {
        const jsonResult: Record<string, unknown> = {}
        const requestBodyEntries = Object.entries(
            request.body as Record<string, unknown>,
        )

        const platformId = await projectService.getPlatformId(projectId)

        for (const [key, value] of requestBodyEntries) {
            if (isMultipartFile(value)) {
                const file = await stepFileService(request.log).saveAndEnrich({
                    data: value.data as Buffer,
                    fileName: value.filename,
                    stepName: 'trigger',
                    flowId,
                    contentLength: value.data.length,
                    platformId,
                    projectId,
                })
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


function extractHeaderFromRequest(request: FastifyRequest): Pick<FlowRun, 'parentRunId' | 'failParentOnFailure'> {
    return {
        parentRunId: request.headers[PARENT_RUN_ID_HEADER] as string,
        failParentOnFailure: request.headers[FAIL_PARENT_ON_FAILURE_HEADER] === 'true',
    }
}