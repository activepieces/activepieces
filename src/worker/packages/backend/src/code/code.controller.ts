import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {ExecuteCodeRequest} from "shared";
import {codeRunner} from "../workers/code-worker/code-runner";

export const codeController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.post('/execute', {
        schema: ExecuteCodeRequest
    }, async (_request: FastifyRequest<{
        Body: ExecuteCodeRequest
    }>, _reply) => {
        const bufferFromBase64 = Buffer.from(_request.body.artifact, 'base64');
        return await codeRunner.run(bufferFromBase64, _request.body.input);
    })

};

