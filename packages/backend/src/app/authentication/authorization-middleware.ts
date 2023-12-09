import { FastifyRequest } from 'fastify'
import { accessTokenManager } from './lib/access-token-manager'
import { ActivepiecesError, EndpointScope, ErrorCode, Principal, PrincipalType, ProjectType, apId, isEmpty, isNil } from '@activepieces/shared'
import { logger } from '@sentry/utils'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { apiKeyService } from '../ee/api-keys/api-key-service'
import { FlowEntity } from '../flows/flow/flow.entity'
import { AppConnectionEntity } from '../app-connection/app-connection.entity'
import { ProjectMemberEntity } from '../ee/project-members/project-member.entity'
import { databaseConnection } from '../database/database-connection'
import { extractResourceName } from './authorization'
import { projectService } from '../project/project-service'
import { nanoid } from 'nanoid'

const HEADER_PREFIX = 'Bearer '
const PLATFORM_API_PREFIX = 'sk-'
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
            if (token.startsWith(PLATFORM_API_PREFIX)) {
                return await getAPIKeyPrincipal(token, request)
            }
            else {
                return await getJwtPrincipal(token, request)
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

async function getJwtPrincipal(token: string, request: FastifyRequest): Promise<Principal> {
    const principal = await accessTokenManager.extractPrincipal(token)

    // TODO Merge with API key once it's specified for all routes, currenttly we ignore old routes
    const allowedPrincipals = request.routeConfig.allowedPrincipals
    if (!isNil(allowedPrincipals) && !allowedPrincipals.includes(principal.type)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'invalid route for principal type',
            },
        })
    }

    const projectId = await getProjectIdFromBodyOrQuery(request)
    if (!isNil(projectId) && principal.projectId !== projectId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'invalid project id',
            },
        })
    }
    return principal
}
async function getAPIKeyPrincipal(rawToken: string, request: FastifyRequest): Promise<Principal> {
    const apiKey = await apiKeyService.getByValueOrThrow(rawToken)

    // TODO enforce in all other princpals types as well
    const allowedPrincipals = request.routeConfig.allowedPrincipals ?? []
    if (!allowedPrincipals.includes(PrincipalType.SERVICE)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'invalid route for principal type',
            },
        })
    }
    const scope = request.routeConfig.scope
    if (scope === EndpointScope.PLATFORM) {
        return {
            id: apiKey.id,
            type: PrincipalType.SERVICE,
            // TODO remove this
            projectId: 'ANONYMOUSE_' + nanoid(),
            projectType: ProjectType.PLATFORM_MANAGED,
            platform: {
                id: apiKey.platformId,
                role: 'OWNER',
            },
        }
    }
    const projectId = await getProjectIdFromRequest(request)
    if (isNil(projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'missing project id',
            },
        })
    }
    const project = await projectService.getOneOrThrow(projectId)
    if (project.platformId !== apiKey.platformId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'invalid project id',
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

async function getProjectIdFromRequest(request: FastifyRequest): Promise<string | undefined> {
    if (request.routerPath.endsWith(':id') && ['GET', 'DELETE', 'POST'].includes(request.method)) {
        const resourceName = extractResourceName(request.routerPath)
        const { id } = request.params as { id: string }
        return extractProjectIdFromResource(resourceName, id)
    }
    return getProjectIdFromBodyOrQuery(request)
}

async function getProjectIdFromBodyOrQuery(request: FastifyRequest): Promise<string | undefined> {
    switch (request.method) {
        case 'POST': {
            const { projectId } = request.body as { projectId: string }
            return projectId
        }
        case 'GET': {
            if (request.routerPath.endsWith('/')) {
                return undefined
            }
            const { projectId } = request.query as { projectId: string }
            return projectId
        }
    }
    return undefined
}


async function extractProjectIdFromResource(resource: string | undefined, id: string): Promise<string | undefined> {
    const tableName = getTableNameFromResource(resource)
    if (isNil(tableName)) {
        return undefined
    }
    const entity = await databaseConnection.getRepository(tableName).findOneBy({
        id,
    })
    return entity?.projectId
}

function getTableNameFromResource(resource: string | undefined): string | undefined {
    if (isNil(resource)) {
        return undefined
    }
    switch (resource) {
        case 'flows':
            return FlowEntity.options.name
        case 'app-connections':
            return AppConnectionEntity.options.name
        case 'project-members':
            return ProjectMemberEntity.options.name
    }
    return undefined
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

