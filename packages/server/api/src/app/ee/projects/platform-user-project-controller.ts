import {
    ActivepiecesError,
    ErrorCode,
    ListProjectRequestForUserQueryParams,
    PrincipalType,
    ProjectWithLimits,
    SeekPage,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { platformService } from '../../platform/platform.service'
import { projectMemberService } from '../project-members/project-member.service'
import { platformProjectService } from './platform-project-service'

export const usersProjectController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {

    fastify.get('/:id', async (request) => {
        return platformProjectService.getWithPlanAndUsageOrThrow(request.principal.projectId)
    })

    fastify.get('/', ListProjectRequestForUser, async (request) => {
        return platformProjectService.getAll({
            principalType: request.principal.type,
            principalId: request.principal.id,
            platformId: request.principal.platform.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? 10,
            displayName: request.query.displayName,
        })
    })

    fastify.post(
        '/:projectId/token',
        SwitchTokenRequestForUser,
        async (request) => {
            const allProjects = await platformProjectService.getAll({
                principalType: request.principal.type,
                principalId: request.principal.id,
                platformId: request.principal.platform.id,
                cursorRequest: null,
                limit: 1000000,
            })
            const project = allProjects.data.find(
                (project) => project.id === request.params.projectId,
            )

            if (!project) {
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
            const projectRole = await projectMemberService.getRole({ userId: request.principal.id, projectId  })
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

    done()
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
