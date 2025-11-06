import {
    ActivepiecesError,
    ErrorCode,
} from '@activepieces/shared'
import { requestUtils } from '../../request/request-utils'
import { BaseAuthzHandler } from '../security-handler'
import { AuthenticatedFastifyRequest } from '../../../../../types/fastify'
import { projectMemberService } from '../../../ee/projects/project-members/project-member.service'
import { AuthorizationType, ProjectAuthorization } from '@activepieces/server-shared'

export class ProjectAuthzHandler extends BaseAuthzHandler<ProjectAuthorizedRequest> {

    protected canHandle(request: AuthenticatedFastifyRequest): request is ProjectAuthorizedRequest {
        if (request.routeOptions.config.security.authorization.type !== AuthorizationType.PROJECT){
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid route for project',
                },
            })
        }
        return true
    }

    protected async doHandle(request: ProjectAuthorizedRequest): Promise<void> {
        const projectId = request.routeOptions.config.security.authorization.project.projectId(request) ?? requestUtils.extractProjectId(request)
        const userId = request.principal.id

        const projectMemberExists = await projectMemberService(request.log).exists({
            projectId,
            userId,
        })

        if (!projectMemberExists) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'user is not a member of the project',
                },
            })
        }

        return Promise.resolve()
    }
}


type ProjectAuthorizedRequest = AuthenticatedFastifyRequest & {
    routeOptions: {
        config: {
            security: {
                authorization: ProjectAuthorization
            }
        }
    }
}