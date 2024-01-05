import { FastifyRequest } from 'fastify'
import { accessTokenManager } from './lib/access-token-manager'
import { ActivepiecesError, EndpointScope, ErrorCode, PlatformRole, Principal, PrincipalType, ProjectType, apId, isEmpty, isNil } from '@activepieces/shared'
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
    const authenticatedRoute = isAuthenticatedRoute(request)
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
    if (allowedPrincipals && !allowedPrincipals.includes(principal.type)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'invalid route for principal type',
            },
        })
    }
    // TODO this is a hack to allow token generation for project id
    const exemptedRoutesFromProjectIdCheck = ['/v1/users/projects/:projectId/token']
    if (exemptedRoutesFromProjectIdCheck.includes(request.routerPath)) {
        return principal
    }
    const projectId = getProjectIdFromBodyOrQuery(request)
    if (projectId && projectId !== principal.projectId) {
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
            projectId: 'ANONYMOUS_' + nanoid(),
            projectType: ProjectType.PLATFORM_MANAGED,
            platform: {
                id: apiKey.platformId,
                role: PlatformRole.OWNER,
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
            role: PlatformRole.OWNER,
        },
    }
}

async function getProjectIdFromRequest(request: FastifyRequest): Promise<string | undefined> {
    if (request.routerPath.includes(':id')) {
        const resourceName = extractResourceName(request.routerPath)
        const { id } = request.params as { id: string }
        return extractProjectIdFromResource(resourceName, id)
    }
    return getProjectIdFromBodyOrQuery(request)
}

function getProjectIdFromBodyOrQuery(request: FastifyRequest): string | undefined {
    if (isObject(request.body) && 'projectId' in request.body) {
        return request.body.projectId as string
    }
    else if (isObject(request.query) && 'projectId' in request.query) {
        return request.query.projectId as string
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

function isAuthenticatedRoute(fastifyRequest: FastifyRequest): boolean {
    const allowedPrincipals = fastifyRequest.routeConfig.allowedPrincipals ?? []
    if (allowedPrincipals.includes(PrincipalType.UNKNOWN)) {
        return false
    }
    const ignoredRoutes = new Set([
        '/favicon.ico',
        '/v1/docs',
        '/redirect',
    ])
    if (ignoredRoutes.has(fastifyRequest.routerPath) || fastifyRequest.routerPath.startsWith('/ui')) {
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

function isObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}
