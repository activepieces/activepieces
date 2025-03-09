
import {
    ALL_PRINCIPAL_TYPES,
    GetFlowVersionForWorkerRequestType,
    WebhookUrlParams,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'

import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'
import { webhookService } from './webhook.service'


export const webhookController: FastifyPluginAsyncTypebox = async (app) => {

    app.all(
        '/:flowId/sync',
        WEBHOOK_PARAMS,
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const response = await webhookService.handleWebhook({
                data: {
                    isFastifyRequest: true,
                    request,
                },
                logger: request.log,
                flowId: request.params.flowId,
                async: false,
                flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
                saveSampleData: await webhookSimulationService(request.log).exists(
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
            const response = await webhookService.handleWebhook({
                data: {
                    isFastifyRequest: true,
                    request,
                },
                logger: request.log,
                flowId: request.params.flowId,
                async: true,
                saveSampleData: await webhookSimulationService(request.log).exists(
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
        const response = await webhookService.handleWebhook({
            data: {
                isFastifyRequest: true,
                request,
            },
            logger: request.log,
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
        const response = await webhookService.handleWebhook({
            data: {
                isFastifyRequest: true,
                request,
            },
            logger: request.log,
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
        const response = await webhookService.handleWebhook({
            data: {
                isFastifyRequest: true,
                request,
            },
            logger: request.log,
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
