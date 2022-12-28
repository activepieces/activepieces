import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { flowWorkerController } from './flow-worker.controller';

export const flowWorkerModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(flowWorkerController, { prefix: '/v1/flow-worker' });
};
