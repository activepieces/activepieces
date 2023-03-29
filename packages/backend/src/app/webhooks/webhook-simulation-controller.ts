import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { WebhookUrlParams } from "@activepieces/shared";
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
            logger.debug([`[WebhookSimulationController] flowId=${request.params.flowId}`]);

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
