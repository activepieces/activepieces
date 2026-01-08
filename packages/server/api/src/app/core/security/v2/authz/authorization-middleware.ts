import { AuthorizationRouteSecurity, AuthorizationType, ProjectResourceType, RouteKind } from '@activepieces/server-shared'
import { isNil, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { authorizeOrThrow } from './authorize'
import { projectIdExtractor } from './projectIdExtractor'


export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    const securityAccessRequest = await convertToSecurityAccessRequest(request)
    await authorizeOrThrow(request.principal, securityAccessRequest, request.log)

    const requestPath = request.routeOptions.config.url
    const bullmqRoute = requestPath.startsWith('/ui')
    if (bullmqRoute) {
        return
    }
    if (security.kind === RouteKind.AUTHENTICATED && security.authorization.type === AuthorizationType.PROJECT) {
        // @ts-expect-error: explicit override for Fastify typing assignment
        request.projectId = securityAccessRequest.authorization.projectId
    }
}

export async function convertToSecurityAccessRequest(request: FastifyRequest): Promise<AuthorizationRouteSecurity> {
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
            return projectIdExtractor.fromTable(request, projectResource)
        case ProjectResourceType.QUERY:
            return projectIdExtractor.fromQuery(request, projectResource)
        case ProjectResourceType.BODY:
            return projectIdExtractor.fromBody(request, projectResource)
        case ProjectResourceType.PARAM:
            return projectIdExtractor.fromParam(request, projectResource)
    }
}
