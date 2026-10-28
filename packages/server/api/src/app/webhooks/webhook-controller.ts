
import { wideEvent } from '@activepieces/server-utils'
import {
    EngineHttpResponse,
    isNil,
    RAW_PAYLOAD_HEADER,
    sanitizeHttpHeaders,
    tryCatch,
    WebhookUrlParams,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { convertRequest, extractHeaderFromRequest } from './webhook-request-converter'
import { WebhookFlowVersionToRun, webhookService } from './webhook.service'

export const webhookController: FastifyPluginAsyncZod = async (app) => {

    app.all(
        '/:flowId/sync',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            wideEvent.set({
                flow: { id: request.params.flowId },
                webhook: {
                    method: request.method,
                    async: false,
                },
            })
            const response = await webhookService.handleWebhook({
                data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                logger: request.log,
                flowId: request.params.flowId,
                async: false,
                flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                saveSampleData: await triggerSourceService(request.log).existsByFlowId({
                    flowId: request.params.flowId,
                    simulate: true,
                }),
                execute: true,
                ...extractRawPayload(request),
                ...extractHeaderFromRequest(request),
            })
            wideEvent.set({ webhook: { responseStatus: response.status } })
            await sendWebhookResponse({ reply, response })
        },
    )

    app.all(
        '/:flowId',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            wideEvent.set({
                flow: { id: request.params.flowId },
                webhook: {
                    method: request.method,
                    async: true,
                },
            })
            const response = await webhookService.handleWebhook({
                data: (projectId: string) => convertRequest(request, projectId, request.params.flowId),
                logger: request.log,
                flowId: request.params.flowId,
                async: true,
                saveSampleData: await triggerSourceService(request.log).existsByFlowId({
                    flowId: request.params.flowId,
                    simulate: true,
                }),
                flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                execute: true,
                ...extractRawPayload(request),
                ...extractHeaderFromRequest(request),
            })
            wideEvent.set({ webhook: { responseStatus: response.status } })
            await sendWebhookResponse({ reply, response })
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
        await sendWebhookResponse({ reply, response })
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
        await sendWebhookResponse({ reply, response })
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
        await sendWebhookResponse({ reply, response })
    })

}

async function sendWebhookResponse({ reply, response }: { reply: FastifyReply, response: EngineHttpResponse }): Promise<void> {
    const { error } = await tryCatch(async () => {
        await reply
            .status(response.status)
            .headers(sanitizeHttpHeaders(response.headers))
            .send(response.body)
    })
    if (!isNil(error) && !reply.raw.headersSent) {
        reply.log.error({ error }, 'Failed to send webhook response')
        await reply.status(500).send({ message: 'Failed to send webhook response' })
    }
}

const WEBHOOK_PARAMS = {
    config: {
        security: securityAccess.public(),
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
