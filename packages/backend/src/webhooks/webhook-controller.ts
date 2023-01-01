import { FastifyPluginCallback, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { FlowId } from "shared";
import { webhookService } from "./webhook-service";

export const webhookController: FastifyPluginCallback = (app, _opts, done): void => {
  app.post("/flow/:flowId", async (request: FastifyRequest<{ Params: PathParams }>, reply) => {
    await webhookService.callback({
      flowId: request.params.flowId,
      payload: request.body,
    });

    await reply.status(StatusCodes.OK).send();
  });

  done();
};

interface PathParams {
  flowId: FlowId;
}
