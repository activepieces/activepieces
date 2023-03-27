import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { FlowId, WebhookUrlParams } from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { logger } from "../helper/logger";
import { webhookService } from "./webhook-service";

export const webhookSimulationController: FastifyPluginAsync = async (app) => {
    app.all(
        "/:flowId",
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
        "/",
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
};

const handler = async (request: FastifyRequest, flowId: FlowId) => {
    logger.debug([`[WebhookSimulationController] flowId=${flowId}`]);

    await webhookService.simulationCallback({
        flowId,
        projectId: request.principal.projectId,
        payload: {
            method: request.method,
            headers: request.headers as Record<string, string>,
            body: request.body,
            queryParams: request.query as Record<string, string>,
        },
    });
};
