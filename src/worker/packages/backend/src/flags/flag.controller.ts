import {FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply} from 'fastify';
import {AuthenticationRequest} from 'shared';
import {flagService} from "./flag.service";

export const flagController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.get(
        '/',
        async (request: FastifyRequest<{ Body: AuthenticationRequest }>, reply: FastifyReply) => {
            reply.send(await flagService.getAll());
        },
    );
};
