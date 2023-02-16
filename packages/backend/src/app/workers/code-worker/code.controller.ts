import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { ExecuteCodeRequest } from "@activepieces/shared";
import { codeRunner } from "./code-runner";

export const codeController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.post(
        "/execute",
        {
            schema: ExecuteCodeRequest,
        },
        async (
            request: FastifyRequest<{
        Body: ExecuteCodeRequest;
      }>,
            _reply
        ) => {
            const bufferFromBase64 = Buffer.from(request.body.artifact, "base64");
            return await codeRunner.run(bufferFromBase64, request.body.input);
        }
    );
};
