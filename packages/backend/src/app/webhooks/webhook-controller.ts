import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { WebhookUrlParams } from '@activepieces/shared';
import { webhookService } from './webhook-service';
import { logger } from '../helper/logger';

export const webhookController: FastifyPluginAsync = async (app) => {
    app.all(
        '/:flowId',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            await handler(request, request.params.flowId);
            await reply.status(StatusCodes.OK).send();
        }
    );

    app.all(
        '/',
        {
            schema: {
                querystring: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Querystring: WebhookUrlParams }>, reply) => {
            await handler(request, request.query.flowId);
            await reply.status(StatusCodes.OK).send();
        }
    );

    app.all(
        '/:flowId/simulate',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            logger.debug(`[WebhookController#simulate] flowId=${request.params.flowId}`);

            await webhookService.simulationCallback({
                flowId: request.params.flowId,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: request.body,
                    queryParams: request.query as Record<string, string>,
                },
            });

            await reply.status(StatusCodes.OK).send();
        }
    );
};

const handler = async (request: FastifyRequest, flowId: string) => {
    await webhookService.callback({
        flowId: flowId,
        payload: {
            method: request.method,
            headers: request.headers as Record<string, string>,
            body: request.body,
            queryParams: request.query as Record<string, string>,
        },
    });
};
