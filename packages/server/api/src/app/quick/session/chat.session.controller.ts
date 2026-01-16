import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ApId, ChatSession, ConversationMessage, ErrorCode, PlanConversationMessage, PrincipalType } from '@activepieces/shared'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { chatSessionService } from './chat.session.service'
import { ChatSessionEntity } from './chat.session.entity'

export const chatSessionController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateChatSessionRequest, async (request, reply) => {

            const session = await chatSessionService.create({
                userId: request.principal.id,
                plan: request.body.plan,
                conversation: request.body.conversation,
            })

            reply.code(StatusCodes.CREATED)
            return session
        }
    )

    app.get(
        '/',
        ListChatSessionsRequest,
        async (request) => {
            return chatSessionService.listByUserId(request.principal.id)
        }
    )

    app.get(
        '/:id',
        GetChatSessionRequest,
        async (request, reply) => {
            const session = await chatSessionService.getOneOrThrow({
                id: request.params.id,
                userId: request.principal.id,
            })

            if (!session) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityId: request.params.id,
                        entityType: 'ChatSession',
                    },
                })
            }

            return session
        }
    )

    app.delete(
        '/:id',
        DeleteChatSessionRequest,
        async (request, reply) => {
            await chatSessionService.delete({
                id: request.params.id,
                userId: request.principal.id,
            })

            reply.code(StatusCodes.NO_CONTENT).send()
        }
    )
}


const CreateChatSessionRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, { 
            tableName: ChatSessionEntity,
            type: ProjectResourceType.TABLE
        }),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Create a new chat session',
        body: Type.Object({
            plan: PlanConversationMessage,
            conversation: Type.Array(ConversationMessage)
        }),
        response: {
            [StatusCodes.CREATED]: ChatSession,
        },
    },
}

const ListChatSessionsRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, { 
            tableName: ChatSessionEntity,
            type: ProjectResourceType.TABLE
        }),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'List all chat sessions of current user',
        response: {
            [StatusCodes.OK]: Type.Array(ChatSession),
        },
    },
}

const GetChatSessionRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, { 
            tableName: ChatSessionEntity,
            type: ProjectResourceType.TABLE
        }),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Get a specific chat session',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: ChatSession,
        },
    },
}

const DeleteChatSessionRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, { 
            tableName: ChatSessionEntity,
            type: ProjectResourceType.TABLE
        }),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Delete a chat session',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}