import { FastifyReply, FastifyRequest } from 'fastify';
import { tokenUtils } from './lib/token-utils';

const ignoredRoutes = new Set([
    '/v1/authentication/sign-in',
    '/v1/authentication/sign-up',
]);

const HEADER_PREFIX = 'Bearer ';

export const tokenVerifyMiddleware = async (request: FastifyRequest, _reply: FastifyReply) => {
    if (ignoredRoutes.has(request.routerPath)) {
        return;
    }

    const token = request.headers.authorization?.substring(HEADER_PREFIX.length);
    const principal = await tokenUtils.decode(token);
    request.principal = principal;
}
