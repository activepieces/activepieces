import { ProjectResourceType, ProjectAuthorization } from "@activepieces/server-shared"
import { FastifyRequest } from "fastify"
import { requestUtils } from "../request/request-utils"

export const securityUtils = {
    async getProjectIdFromRequest(request: FastifyRequest, projectAuthorization: ProjectAuthorization): Promise<string | undefined> {
        switch (projectAuthorization.projectResource.type) {
            case ProjectResourceType.TABLE:
                return await requestUtils.extractProjectIdFromTable(request, projectAuthorization.projectResource)
            case ProjectResourceType.QUERY:
                return requestUtils.extractProjectIdFromQuery(request, projectAuthorization.projectResource)
            case ProjectResourceType.BODY:
                return requestUtils.extractProjectIdFromBody(request, projectAuthorization.projectResource)
        }
    },
}

