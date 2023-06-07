import { FastifyRequest } from 'fastify'
import { tokenUtils } from './lib/token-utils'
import { ActivepiecesError, ErrorCode, PrincipalType, apId } from '@activepieces/shared'

const ignoredRoutes = new Set([
    // BEGIN EE
    '/v1/connection-keys/app-connections',
    '/v1/firebase/users',
    '/v1/firebase/sign-in',
    '/v1/billing/stripe/webhook',
    // END EE
    '/v1/pieces/stats',
    '/v1/pieces/:name',
    '/v1/app-events/:pieceName',
    '/v1/authentication/sign-in',
    '/v1/authentication/sign-up',
    '/v1/flags',
    '/v1/webhooks',
    '/v1/webhooks/:flowId',
    '/v1/webhooks/:flowId/sync',
    '/v1/webhooks/:flowId/simulate',
    '/v1/docs',
    '/redirect',
])

const HEADER_PREFIX = 'Bearer '

export const tokenVerifyMiddleware = async (request: FastifyRequest): Promise<void> => {
    request.principal = {
        id: `ANONYMOUS_${apId()}`,
        type: PrincipalType.UNKNOWN,
        projectId: `ANONYMOUS_${apId()}`,
    }
    const rawToken = request.headers.authorization
    if (!rawToken) {
        if (requiresAuthentication(request.routerPath, request.method)) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_BEARER_TOKEN, params: {} })
        }
    }
    else {
        try {
            const token = rawToken.substring(HEADER_PREFIX.length)
            const principal = await tokenUtils.decode(token)
            request.principal = principal
        }
        catch (e) {
            if (requiresAuthentication(request.routerPath, request.method)) {
                throw new ActivepiecesError({ code: ErrorCode.INVALID_BEARER_TOKEN, params: {} })
            }
        }
    }
}

function requiresAuthentication(routerPath: string, method: string) {
    if (ignoredRoutes.has(routerPath)) {
        return false
    }
    if (routerPath == '/v1/app-credentials' && method == 'GET') {
        return false
    }
    if(routerPath == '/v1/pieces' && method == 'GET') {
        return false
    }
    return true
}