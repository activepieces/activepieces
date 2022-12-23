import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationRequest } from 'shared';
import { authenticationService } from './authentication.service';

export const authenticationController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.post('/sign-up', async (request: FastifyRequest<{ Body: AuthenticationRequest }>, reply: FastifyReply) => {
        const authenticationResponse = await authenticationService.signUp(request.body);
        reply.send(authenticationResponse);
    });

    app.post('/sign-in', async (request: FastifyRequest<{ Body: AuthenticationRequest }>, reply: FastifyReply) => {
        const authenticationResponse = await authenticationService.signIn(request.body);
        reply.send(authenticationResponse);
    });
};
