import {
    ActivepiecesError,
    ErrorCode,
    PlatformRole,
    PrincipalType,
    ProjectWithLimits,
    SeekPage,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { platformProjectService } from './platform-project-service'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { platformService } from '../../platform/platform.service'
import { StatusCodes } from 'http-status-codes'

export const usersProjectController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {
    fastify.get('/', ListProjectRequestForUser, async (request) => {
        return platformProjectService.getAll({
            ownerId: request.principal.id,
            platformId: request.query.platformId,
        })
    })

    fastify.post(
        '/:projectId/token',
        SwitchTokenRequestForUser,
        async (request) => {
            const allProjects = await platformProjectService.getAll({
                ownerId: request.principal.id,
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
            const platform = await platformService.getOneOrThrow(project.platformId)
            return {
                token: await accessTokenManager.generateToken({
                    id: request.principal.id,
                    type: request.principal.type,
                    projectId: request.params.projectId,
                    platform: {
                        id: platform.id,
                        role:
                            platform.ownerId === request.principal.id
                                ? PlatformRole.OWNER
                                : PlatformRole.MEMBER,
                    },
                }),
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
        querystring: Type.Object({
            platformId: Type.Optional(Type.String()),
        }),
    },
}
