
import {
    RAW_PAYLOAD_HEADER,
    WebhookUrlParams,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { convertRequest, extractHeaderFromRequest } from './webhook-request-converter'
import { WebhookFlowVersionToRun, webhookService } from './webhook.service'

const tracer = trace.getTracer('webhook-controller')

export const webhookController: FastifyPluginAsyncZod = async (app) => {

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
                        ...extractRawPayload(request),
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
                        ...extractRawPayload(request),
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


function extractRawPayload(request: FastifyRequest): { payload?: Record<string, unknown> } {
    const isRawPayload = request.headers[RAW_PAYLOAD_HEADER] === 'true'
        && request.headers.authorization
        && request.body != null
        && !Array.isArray(request.body)
        && !Buffer.isBuffer(request.body)
    if (isRawPayload) {
        return { payload: request.body as Record<string, unknown> }
    }
    return {}
}
