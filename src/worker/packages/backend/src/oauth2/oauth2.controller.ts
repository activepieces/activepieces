import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {ClaimTokenWithSecretRequest} from "shared/dist/oauth2/dto/claim-token-with-secret";
import {ClaimTokenFromCloudRequest} from "shared/dist/oauth2/dto/claim-token-from-cloud";
import {oauth2Service} from "./oauth2.service";

export const oauth2Controller = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.post('/claim', {
        schema: {
            body: ClaimTokenWithSecretRequest
        }
    }, async (request: FastifyRequest<
        {
            Body: ClaimTokenWithSecretRequest
        }>, _reply) => {
       return await oauth2Service.claim(request.body);
    });



}