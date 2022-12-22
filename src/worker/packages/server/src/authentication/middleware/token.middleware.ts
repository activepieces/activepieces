import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';

const ISSUER = 'activepieces';
const ONE_HOUR = 3600;

export const tokenMiddleware = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(fastifyJwt, {
        secret: 'supersecret',
        verify: {
            allowedIss: ISSUER,
        },
        sign: {
            iss: ISSUER,
            expiresIn: ONE_HOUR,
        },
    });

    app.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
        await request.jwtVerify();
    });
};
