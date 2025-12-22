import { AuthorizationRouteSecurity, AuthorizationType, ProjectBodyResource, ProjectParamResource, ProjectQueryResource, ProjectResourceType, ProjectTableResource, RouteKind } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, isNil, isObject, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { databaseConnection } from '../../../../database/database-connection'
import { authorizeOrThrow } from './authorize'


export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    // Todo(@chaker): remove this once we remove v1 authn
    if (isNil(security)) {
        return
    }
    const securityAccessRequest = await convertToSecurityAccessRequest(request)
    await authorizeOrThrow(request.principal, securityAccessRequest, request.log)
    
    if (security.kind === RouteKind.AUTHENTICATED && security.authorization.type === AuthorizationType.PROJECT) {
        // @ts-expect-error: explicit override for Fastify typing assignment
        request.projectId = securityAccessRequest.authorization.projectId
    }
    
}

async function convertToSecurityAccessRequest(request: FastifyRequest): Promise<AuthorizationRouteSecurity> {
    const security = request.routeOptions.config?.security
    if (isNil(security) || security.kind === RouteKind.PUBLIC) {
        return {
            kind: RouteKind.PUBLIC,
        }
    }
    switch (security.authorization.type) {
        case AuthorizationType.PROJECT:
            return {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: security.authorization.allowedPrincipals,
                    permission: security.authorization.permission,
                    projectId: await getProjectIdFromRequest(request),
                },
            }
        case AuthorizationType.PLATFORM:
            return {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    adminOnly: security.authorization.adminOnly,
                    type: AuthorizationType.PLATFORM,
                    allowedPrincipals: security.authorization.allowedPrincipals,
                },
            }
        case AuthorizationType.UNSCOPED:
            return {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: security.authorization.allowedPrincipals,
                },
            }
        case AuthorizationType.NONE:
            return {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.NONE,
                    reason: security.authorization.reason,
                },
            }
    }
}

async function getProjectIdFromRequest(request: FastifyRequest): Promise<string | undefined> {
    if (request.principal.type === PrincipalType.ENGINE) {
        return request.principal.projectId
    }
    const security = request.routeOptions.config?.security
    if (!security) {
        return undefined
    }
    if (security.kind === RouteKind.PUBLIC) {
        return undefined
    }
    if (security.authorization.type !== AuthorizationType.PROJECT) {
        return undefined
    }
    const projectResource = security.authorization.projectResource
    if (isNil(projectResource)) {
        return undefined
    }

    switch (projectResource.type) {
        case ProjectResourceType.TABLE:
            return extractProjectIdFromTable(request, projectResource)
        case ProjectResourceType.QUERY:
            return extractProjectIdFromQuery(request, projectResource)
        case ProjectResourceType.BODY:
            return extractProjectIdFromBody(request, projectResource)
        case ProjectResourceType.PARAM:
            return extractProjectIdFromParam(request, projectResource)
    }
}

async function extractProjectIdFromTable(
    request: FastifyRequest,
    projectTableResource: ProjectTableResource,
): Promise<string | undefined> {
    const routerPath = request.routeOptions.url
    assertNotNullOrUndefined(routerPath, 'routerPath is undefined')
    const { paramKey, entityField } = projectTableResource.lookup ?? {
        paramKey: 'id',
        entityField: 'id',
    }

    const hasIdParam = routerPath.includes(`:${paramKey}`) &&
        isObject(request.params) &&
        paramKey in request.params &&
        typeof request.params[paramKey] === 'string'

    if (!hasIdParam) {
        return undefined
    }

    const { [paramKey]: paramValue } = request.params as Record<string, string>

    const entity = await databaseConnection().getRepository(projectTableResource.tableName).findOneBy({
        [entityField]: paramValue,
    })

    return entity?.projectId ?? entity?.projectIds?.[0] ?? undefined
}

function extractProjectIdFromBody(request: FastifyRequest, projectBodyResource: ProjectBodyResource): string | undefined {
    const key = projectBodyResource.bodyKey ?? 'projectId'
    if (isObject(request.body) && key in request.body) {
        return request.body[key] as string
    }

    return undefined
}

function extractProjectIdFromQuery(request: FastifyRequest, projectQueryResource: ProjectQueryResource): string | undefined {
    const key = projectQueryResource.queryKey ?? 'projectId'
    if (isObject(request.query) && key in request.query) {
        return request.query[key] as string
    }

    return undefined
}

async function extractProjectIdFromParam(request: FastifyRequest, projectParamResource: ProjectParamResource): Promise<string | undefined> {
    const key = projectParamResource.paramKey ?? 'projectId'
    const { [key]: paramValue } = request.params as Record<string, string>
    return paramValue ?? undefined
}