import { ProjectResourceType, ProjectTableResource, ProjectBodyResource, ProjectQueryResource, RouteKind, AuthorizationType, RouteSecurity } from "@activepieces/server-shared"
import { FastifyRequest } from "fastify"
import { assertNotNullOrUndefined, isObject } from "@activepieces/shared"
import { databaseConnection } from "../../database/database-connection"
import { authorizeOrThrow } from "./authorize"


export const authorizationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const securityAccessRequest = await convertToSecurityAccessRequest(request)
    await authorizeOrThrow(request.principal, securityAccessRequest)
}

async function convertToSecurityAccessRequest(request: FastifyRequest): Promise<RouteSecurity<RawProjectResource>> {
    const security = request.routeOptions.config?.security
    if (security.kind === RouteKind.PUBLIC) {
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
                    projectResource: {
                        type: ProjectResourceType.RAW,
                        projectId: await getProjectIdFromRequest(request),
                    },
                },
            }
        case AuthorizationType.PLATFORM:
        case AuthorizationType.NONE:
        case AuthorizationType.WORKER:
            return security
    }
}

async function getProjectIdFromRequest(request: FastifyRequest): Promise<string | undefined> {
    const security = request.routeOptions.config?.security
    if (security.kind === RouteKind.PUBLIC) {
        return undefined
    }
    if (security.authorization.type !== AuthorizationType.PROJECT) {
        return undefined
    }
    const projectResource = security.authorization.projectResource
    switch (projectResource.type) {
        case ProjectResourceType.TABLE:
            return await extractProjectIdFromTable(request, projectResource)
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

function extractProjectIdFromBody(request: FastifyRequest, projectBodyResource: ProjectBodyResource): string | undefined {
    if (isObject(request.body) && projectBodyResource.key in request.body) {
        return request.body[projectBodyResource.key] as string
    }

    return undefined
}

function extractProjectIdFromQuery(request: FastifyRequest, projectQueryResource: ProjectQueryResource): string | undefined {
    if (isObject(request.query) && projectQueryResource.key in request.query) {
        return request.query[projectQueryResource.key] as string
    }

    return undefined
}
