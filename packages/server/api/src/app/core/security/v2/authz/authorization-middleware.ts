import { AuthorizationRouteSecurity, AuthorizationType, ProjectBodyResource, ProjectQueryResource, ProjectResourceType, ProjectTableResource, RouteKind } from '@activepieces/server-shared'
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
        case AuthorizationType.WORKER:
            return {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.WORKER,
                },
            }
        case AuthorizationType.ENGINE:
            return {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.ENGINE,
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
    switch (projectResource.type) {
        case ProjectResourceType.TABLE:
            return extractProjectIdFromTable(request, projectResource)
        case ProjectResourceType.QUERY:
            return extractProjectIdFromQuery(request, projectResource)
        case ProjectResourceType.BODY:
            return extractProjectIdFromBody(request, projectResource)
    }
}

async function extractProjectIdFromTable(
    request: FastifyRequest,
    projectTableResource: ProjectTableResource,
): Promise<string | undefined> {
    const routerPath = request.routeOptions.url
    assertNotNullOrUndefined(routerPath, 'routerPath is undefined')

    const hasIdParam = routerPath.includes(':id') &&
        isObject(request.params) &&
        'id' in request.params &&
        typeof request.params.id === 'string'

    if (!hasIdParam) {
        return undefined
    }

    const { id } = request.params as { id: string }

    const entity = await databaseConnection().getRepository(projectTableResource.tableName).findOneBy({
        id,
    })
    return entity?.projectId ?? undefined
}

function extractProjectIdFromBody(request: FastifyRequest, _projectBodyResource: ProjectBodyResource): string | undefined {

    if (isObject(request.body) && 'projectId' in request.body) {
        return request.body.projectId as string
    }

    return undefined
}

function extractProjectIdFromQuery(request: FastifyRequest, _projectQueryResource: ProjectQueryResource): string | undefined {
    if (isObject(request.query) && 'projectId' in request.query) {
        return request.query.projectId as string
    }

    return undefined
}