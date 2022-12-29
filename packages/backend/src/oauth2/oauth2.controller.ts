import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { oauth2Service } from "./oauth2.service";
import { ClaimTokenWithSecretRequest } from "shared";

export const oauth2Controller = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.post(
    "/claim",
    {
      schema: {
        body: ClaimTokenWithSecretRequest,
      },
    },
    async (
      request: FastifyRequest<{
        Body: ClaimTokenWithSecretRequest;
      }>,
      _reply
    ) => {
      return await oauth2Service.claim(request.body);
    }
  );
};
