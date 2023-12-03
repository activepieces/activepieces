import { StatusCodes } from 'http-status-codes'
import { ListProjectMembersRequest, SendInvitationRequest } from '@activepieces/ee-shared'
import { projectMemberService } from './project-member.service'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { logger } from '../../helper/logger'

export const projectMemberModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectMemberController, { prefix: '/v1/project-members' })
}

const DEFAULT_LIMIT_SIZE = 10

const projectMemberController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/', {
        schema: {
            querystring: ListProjectMembersRequest,
        },
    }, async (request) => {
        return projectMemberService.list(request.principal.projectId, request.query.cursor ?? null, request.query.limit ?? DEFAULT_LIMIT_SIZE)
    })

    fastify.post(
        '/accept',
        {
            schema: {
                body: Type.Object({
                    token: Type.String(),
                }),
            },
        },
        async (
            request,
            reply,
        ) => {
            try {
                const userId = request.principal.id
                return await projectMemberService.accept({
                    userId,
                    invitationToken: request.body.token,
                })
            }
            catch (e) {
                logger.error(e)
                return reply.status(StatusCodes.UNAUTHORIZED).send()
            }
        },
    )

    fastify.post(
        '/invite',
        {
            schema: {
                body: SendInvitationRequest,
            },
        },
        async (
            request,
        ) => {
            const { invitationToken } = await projectMemberService.upsertAndSend({
                ...request.body,
                projectId: request.principal.projectId,
                platformId: request.principal.platform?.id ?? null,
            })

            return {
                token: invitationToken,
            }
        },
    )

    fastify.delete(
        '/:invitationId',
        {
            schema: {
                params: Type.Object({
                    invitationId: Type.String(),
                }),
            },
        },
        async (
            request,
            reply,
        ) => {
            await projectMemberService.delete(request.principal.projectId, request.params.invitationId)
            return reply.status(StatusCodes.OK).send()
        },
    )
}
