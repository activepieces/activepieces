import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { oauth2Service } from "./oauth2.service";
import { ClaimTokenFromCloudRequest, ClaimTokenWithSecretRequest } from "@activepieces/shared";

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
            reply
        ) => {
            const result = await oauth2Service.claim(request.body);
            return result;
        }
    );

    fastify.post(
        "/claim-with-cloud",
        {
            schema: {
                body: ClaimTokenFromCloudRequest,
            },
        },
        async (
            request: FastifyRequest<{
        Body: ClaimTokenFromCloudRequest;
      }>,
            reply
        ) => {
            const result = await oauth2Service.claimWithCloud(request.body);
            return result;
        }
    );
};
