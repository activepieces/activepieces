import { FastifyRequest } from 'fastify'
import { accessTokenManager } from './lib/access-token-manager'
import { ActivepiecesError, ErrorCode, Principal, PrincipalType, ProjectType, apId, isEmpty, isNil } from '@activepieces/shared'
import { logger } from '@sentry/utils'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { apiKeyService } from '../ee/api-keys/api-key-service'
import { projectService } from '../project/project-service'

const HEADER_PREFIX = 'Bearer '
const PLATFORM_API_PREFIX = 'sk_'
const API_KEY = system.get(SystemProp.API_KEY)

export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const isGlobalApiKeyRoute = await isGlobalApiKey(request)

    if (isGlobalApiKeyRoute) {
        handleGlobalApiKey(request)
        return
    }

    const principal = await getPrincipal(request)
    const authenticatedRoute = isAuthenticatedRoute(request.routerPath, request.method)
    request.principal = principal

    if (principal.type === PrincipalType.UNKNOWN && authenticatedRoute) {
        handleInvalidBearerToken()
        return
    }
}

async function isGlobalApiKey(request: FastifyRequest): Promise<boolean> {
    return [
        { method: 'POST', url: '/v1/admin/pieces' },
        { method: 'POST', url: '/v1/admin/flow-templates' },
        { method: 'DELETE', url: '/v1/admin/flow-templates' },
        { method: 'POST', url: '/v1/admin/flow-templates/:id' },
        { method: 'POST', url: '/v1/admin/users' },
        { method: 'POST', url: '/v1/admin/platforms' },
    ].some(f => f.url === request.routerPath && f.method.toUpperCase() === request.method)
}

async function getPrincipal(request: FastifyRequest): Promise<Principal> {
    const rawToken = request.headers.authorization
    if (rawToken) {
        try {
            const token = rawToken.substring(HEADER_PREFIX.length)

            if (rawToken.startsWith(PLATFORM_API_PREFIX)) {
                return await getAPIKeyPrincipal(token, request)
            }
            else {
                return await accessTokenManager.extractPrincipal(token)
            }
        }
        catch (e) {
            logger.warn({ err: e }, 'invalid access token')
        }
    }
    return {
        id: `ANONYMOUS_${apId()}`,
        type: PrincipalType.UNKNOWN,
        projectId: `ANONYMOUS_${apId()}`,
        projectType: ProjectType.STANDALONE,
    }

}

async function getAPIKeyPrincipal(rawToken: string, request: FastifyRequest): Promise<Principal> {
    const apiKey = await apiKeyService.getByValueOrThrow(rawToken)
    const projectId = request.headers['x-project-id'] as string
    const project = await projectService.getOneOrThrow(projectId)

    if (project.platformId !== apiKey.platformId) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: 'invalid access token',
            },
        })
    }

    return {
        id: apiKey.id,
        type: PrincipalType.SERVICE,
        projectId: project.id,
        projectType: ProjectType.PLATFORM_MANAGED,
        platform: {
            id: apiKey.platformId,
            role: 'OWNER',
        },
    }
}
function isAuthenticatedRoute(routerPath: string, method: string): boolean {
    const ignoredRoutes = new Set([
        // BEGIN EE
        '/v1/connection-keys/app-connections',
        '/v1/billing/stripe/webhook',
        '/v1/flow-templates',
        '/v1/appsumo/token',
        '/v1/appsumo/action',
        '/v1/flow-templates/:id',
        '/v1/project-members/accept',
        '/v1/managed-authn/external-token',
        '/v1/otp',
        '/v1/authn/local/reset-password',
        '/v1/authn/federated/login',
        '/v1/authn/federated/claim',
        // END EE
        '/v1/chatbots/:id/ask',
        '/v1/chatbots/:id/metadata',
        '/v1/flow-runs/:id/resume',
        '/v1/pieces/stats',
        '/v1/authn/local/verify-email',
        '/v1/pieces/:name',
        '/favicon.ico',
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
    if (ignoredRoutes.has(routerPath) || routerPath.startsWith('/ui')) {
        return false
    }

    if ((routerPath === '/v1/app-credentials' && method === 'GET') ||
        (routerPath === '/v1/pieces' && method === 'GET')) {
        return false
    }

    return true
}

function handleGlobalApiKey(request: FastifyRequest): void {
    if (isEmpty(API_KEY) || isNil(API_KEY)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {},
        })
    }

    const requestApiKey = request.headers['api-key']
    const keyNotMatching = API_KEY !== requestApiKey

    if (keyNotMatching) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {},
        })
    }
}

function handleInvalidBearerToken(): void {
    throw new ActivepiecesError({
        code: ErrorCode.INVALID_BEARER_TOKEN,
        params: {
            message: 'invalid access token',
        },
    })
}

