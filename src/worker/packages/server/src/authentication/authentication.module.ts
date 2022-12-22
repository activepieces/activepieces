import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { tokenMiddleware } from './middleware/token.middleware';

export const authenticationModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(tokenMiddleware);
};
