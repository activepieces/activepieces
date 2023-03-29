import { FastifyInstance } from 'fastify';
import { openapiController } from './openapi.controller';

export const openapiModule = async (app: FastifyInstance) => {
    app.register(openapiController, { prefix: '/v1/docs' });
};
