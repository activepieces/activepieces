import { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { Static, Type } from "@sinclair/typebox";
import { ApId } from "@activepieces/shared";
import { webhookService } from "./webhook-service";

export const webhookController: FastifyPluginCallback = (app, _opts, done): void => {
    app.post(
        "/",
        {
            schema: {
                querystring: WebhookQueryParams,
            },
        },
        async (request: FastifyRequest<{ Querystring: WebhookQueryParams }>, reply) => {
            webhookService.callback({
                flowId: request.query.flowId,
                payload: {
                    headers: request.headers,
                    body: request.body,
                    queryParams: request.query
                },
            });
            await reply.status(StatusCodes.OK).send();
        }
    );

    /**
   * Used by applications to test webhooks
   */
    app.get("/", (_req: FastifyRequest, res: FastifyReply) => res.status(StatusCodes.OK).send());

    done();
};

const WebhookQueryParams = Type.Object({
    flowId: ApId,
});

type WebhookQueryParams = Static<typeof WebhookQueryParams>;
