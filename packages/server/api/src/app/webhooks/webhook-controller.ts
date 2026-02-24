
import { securityAccess } from '@activepieces/server-shared'
import {
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
import { FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { stepFileService } from '../file/step-file/step-file.service'
import { projectService } from '../project/project-service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { WebhookFlowVersionToRun } from './webhook-handler'
import { isBinaryContentType } from './webhook-utils'
import { webhookService } from './webhook.service'

const tracer = trace.getTracer('webhook-controller')

export const webhookController: FastifyPluginAsyncTypebox = async (app) => {

    app.all(
        '/:flowId/sync',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
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
    )

    app.all(
        '/:flowId',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
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
    )

    app.all('/:flowId/draft/sync', WEBHOOK_PARAMS, async (request, reply) => {
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
    })

    app.all('/:flowId/draft', WEBHOOK_PARAMS, async (request, reply) => {
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
    })

    app.all('/:flowId/test', WEBHOOK_PARAMS, async (request, reply) => {
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
    })

}


const WEBHOOK_PARAMS = {
    config: {
        security: securityAccess.public(),
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
    const contentType = request.headers['content-type']
    const isBinary = isBinaryContentType(contentType) && Buffer.isBuffer(request.body)
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, projectId, flowId),
        queryParams: request.query as Record<string, string>,
        rawBody: isBinary ? undefined : request.rawBody,
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
    const contentType = request.headers['content-type']
    if (isBinaryContentType(contentType) && Buffer.isBuffer(request.body)) {
        const platformId = await projectService.getPlatformId(projectId)
        const extension = mime.extension(contentType?.split(';')[0] || '') || 'bin'
        const fileName = `file.${extension}`

        const file = await stepFileService(request.log).saveAndEnrich({
            data: request.body,
            fileName,
            stepName: 'trigger',
            flowId,
            contentLength: request.body.length,
            platformId,
            projectId,
        })
        return {
            fileUrl: file.url,
        }
    }

    return request.body
}


function extractHeaderFromRequest(request: FastifyRequest): Pick<FlowRun, 'parentRunId' | 'failParentOnFailure'> {
    return {
        parentRunId: request.headers[PARENT_RUN_ID_HEADER] as string,
        failParentOnFailure: request.headers[FAIL_PARENT_ON_FAILURE_HEADER] === 'true',
    }
}