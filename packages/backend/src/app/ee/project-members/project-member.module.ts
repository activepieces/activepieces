import { StatusCodes } from 'http-status-codes'
import { ListProjectMembersRequest, SendInvitationRequest } from '@activepieces/ee-shared'
import { projectMemberService } from './project-member.service'
import { tokenUtils } from '../../authentication/lib/token-utils'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { logger } from '../../helper/logger'
import { Principal } from '@activepieces/shared'

export const projectMemberModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectMemberController, { prefix: '/v1/project-members' })
}

const DEFAULT_LIMIT_SIZE = 10

type ProjectMemberToken = {
    id: string
}

const projectMemberController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/', {
        schema: {
            querystring: ListProjectMembersRequest,
        },
    }, async (request) => {
        return await projectMemberService.list(request.principal.projectId, request.query.cursor ?? null, request.query.limit ?? DEFAULT_LIMIT_SIZE)
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
                const principal = await tokenUtils.decode(request.body.token) as ProjectMemberToken
                await reply.status(StatusCodes.OK).send(await projectMemberService.accept(principal.id))
            }
            catch (e) {
                logger.error(e)
                await reply.status(StatusCodes.UNAUTHORIZED).send()
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
            const invitation = await projectMemberService.send(request.principal.projectId, request.body)
            return {
                token: await tokenUtils.encode({
                    id: invitation.id,
                } as Principal),
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
