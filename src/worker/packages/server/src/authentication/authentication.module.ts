import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { tokenVerifyMiddleware } from './token-verify-middleware';
import { authenticationController } from './authentication.controller';

export const authenticationModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.addHook('onRequest', tokenVerifyMiddleware);
    app.register(authenticationController, { prefix: '/v1/authentication' });
};
