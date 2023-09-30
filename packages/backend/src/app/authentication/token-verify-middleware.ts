import { FastifyRequest } from 'fastify'
import { tokenUtils } from './lib/token-utils'
import { ActivepiecesError, ErrorCode, Principal, PrincipalType, apId } from '@activepieces/shared'

const ignoredRoutes = new Set([
    '/v1/chatbots/:id/ask',
    '/v1/chatbots/:id/metadata',
    '/v1/flow-runs/:id/resume',
    '/v1/pieces/stats',
    '/v1/pieces/:name',
    '/v1/pieces/:scope/:name',
    '/v1/app-events/:pieceUrl',
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
            const principal = await tokenUtils.decode(token) as Principal
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
    if (routerPath == '/v1/pieces' && method == 'GET') {
        return false
    }
    return true
}
