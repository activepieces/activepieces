import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    ListProjectRequestForUserQueryParams,
    PrincipalType,
    ProjectWithLimits,
    SeekPage,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { projectMemberService } from '../project-members/project-member.service'
import { platformProjectService } from './platform-project-service'

export const usersProjectController: FastifyPluginAsyncTypebox = async (
    fastify,
) => {

    fastify.get('/:id', async (request) => {
        return platformProjectService(request.log).getWithPlanAndUsageOrThrow(request.principal.projectId)
    })

    fastify.get('/', ListProjectRequestForUser, async (request) => {
        return platformProjectService(request.log).getAllForPlatform({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? 10,
        })
    })

    fastify.post(
        '/:projectId/token',
        SwitchTokenRequestForUser,
        async (request) => {
            const user = await userService.getOneOrFail({ id: request.principal.id })
            const projects = await projectService.getAllForUser(user)
            const project = projects.find(p => p.id === request.params.projectId)
            if (isNil(project)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityId: request.params.projectId,
                        entityType: 'project',
                    },
                })
            }
            const projectId = request.params.projectId
            const platform = await platformService.getOneOrThrow(project.platformId)
            const projectRole = await projectMemberService(request.log).getRole({ userId: request.principal.id, projectId  })
            return {
                token: await accessTokenManager.generateToken({
                    id: request.principal.id,
                    type: request.principal.type,
                    projectId,
                    platform: {
                        id: platform.id,
                    },
                    tokenVersion: request.principal.tokenVersion,
                }),
                projectRole,
            }
        },
    )
    
}

const SwitchTokenRequestForUser = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            projectId: Type.String(),
        }),
    },
}

const ListProjectRequestForUser = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectWithLimits),
        },
        querystring: ListProjectRequestForUserQueryParams,
    },
}
