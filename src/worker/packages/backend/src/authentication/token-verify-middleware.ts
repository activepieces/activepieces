import {FastifyReply, FastifyRequest} from 'fastify';
import {tokenUtils} from './lib/token-utils';
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";

const ignoredRoutes = new Set([
    '/v1/authentication/sign-in',
    '/v1/authentication/sign-up',
]);

const HEADER_PREFIX = 'Bearer ';

export const tokenVerifyMiddleware = async (request: FastifyRequest, _reply: FastifyReply) => {
    if (ignoredRoutes.has(request.routerPath)) {
        return;
    }
    const rawToken = request.headers.authorization;
    if(rawToken === undefined || rawToken === null){
        throw new ActivepiecesError({code: ErrorCode.INVALID_BEARER_TOKEN, params: {}});
    }else {
        try {
            const token = rawToken.substring(HEADER_PREFIX.length);
            const principal = await tokenUtils.decode(token);
            request.principal = principal;
        } catch (e) {
            throw new ActivepiecesError({code: ErrorCode.INVALID_BEARER_TOKEN, params: {}});
        }
    }
}
