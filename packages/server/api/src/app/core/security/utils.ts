import { AuthorizationType, RouteKind, ProjectResourceType } from "@activepieces/server-shared"
import { ActivepiecesError, ErrorCode, isNil } from "@activepieces/shared"
import { FastifyRequest } from "fastify"
import { requestUtils } from "../request/request-utils"

export const securityUtils = {
    async getProjectIdFromRequest(request: FastifyRequest): Promise<string> {
        const security = request.routeOptions.config?.security

        if (security?.kind === RouteKind.PUBLIC){
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'public route is not allowed',
                },
            })
        }
        
        if (security?.authorization.type !== AuthorizationType.PROJECT) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'project authorization is not allowed',
                },
            })
        }
        
        let projectId: string | undefined
        const projectResource = security?.authorization.projectResource

        if (projectResource.type === ProjectResourceType.TABLE) {
            projectId = await requestUtils.extractProjectIdFromTable(request, projectResource)
        } 
        else if (projectResource.type === ProjectResourceType.QUERY) {
            projectId = requestUtils.extractProjectIdFromQuery(request, projectResource)
        }
        
        else if (projectResource.type === ProjectResourceType.BODY) {
            projectId = requestUtils.extractProjectIdFromBody(request, projectResource)
        }

        if (isNil(projectId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'project id is not available for this route',
                },
            })
        }
        return projectId
    },
}

