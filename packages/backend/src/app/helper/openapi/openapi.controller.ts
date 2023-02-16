import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export const openapiController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get(
        "/",
        async (_request, _reply) => {
            return JSON.stringify(fastify.swagger(),null,2);
        }
    );
}