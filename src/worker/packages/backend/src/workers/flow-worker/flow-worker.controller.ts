import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {ExecuteTestRequest} from "shared";
import { flowWorker } from "./flow-worker";


export const flowWorkerController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.post('/execute-test', {
        schema: ExecuteTestRequest
    }, async (request: FastifyRequest<{
        Body: ExecuteTestRequest
    }>, _reply) => {
        return await flowWorker.executeTest(request.body.collectionVersionId, request.body.flowVersionId, request.body.payload);
    })

};

