import { FastifyPluginCallback, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { Static, Type } from "@sinclair/typebox";
import { ApId } from "shared";
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
      await webhookService.callback({
        flowId: request.query.flowId,
        payload: request.body,
      });

      await reply.status(StatusCodes.OK).send();
    }
  );

  done();
};

const WebhookQueryParams = Type.Object({
  flowId: ApId,
});

type WebhookQueryParams = Static<typeof WebhookQueryParams>;
