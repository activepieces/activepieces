import { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { Static, Type } from "@sinclair/typebox";
import { ApId } from "@activepieces/shared";
import { webhookService } from "./webhook-service";

export const webhookController: FastifyPluginCallback = (app, _opts, done): void => {

    app.all(
        "/:flowId",
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            handler(request, request.params.flowId);
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
            handler(request, request.query.flowId);
            await reply.status(StatusCodes.OK).send();
        }
    );

    done();
};

function handler(request: FastifyRequest, flowId: string){
    webhookService.callback({
        flowId: flowId,
        payload: {
            headers: request.headers,
            body: request.body,
            queryParams: request.query
        },
    });
}
const WebhookUrlParams = Type.Object({
    flowId: ApId,
});

type WebhookUrlParams = Static<typeof WebhookUrlParams>;
