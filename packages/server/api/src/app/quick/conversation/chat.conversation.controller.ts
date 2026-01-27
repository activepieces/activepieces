import { AppSystemProp, securityAccess } from '@activepieces/server-shared'
import { ApId, ChatConversationSchema, ConversationMessageSchema, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { chatConversationService } from './chat.conversation.service'

export const chatConversationController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateChatConversationRequestConfig, async (request) => {
        const conversation = await chatConversationService(request.log).create({
            userId: request.principal.id,
            sessionId: request.body.sessionId,
            conversation: request.body.conversation,
        })
        return conversation
    })

    app.post('/:id', UpdateChatConversationRequestConfig, async (request) => {
        return chatConversationService(request.log).update({
            id: request.params.id,
            sessionId: request.body.sessionId,
            userId: request.principal.id,
            conversation: request.body.conversation,
        })
    })

    app.get(
        '/:id',
        GetChatConversationRequest,
        async (request) => {
            return chatConversationService(request.log).getOneOrThrow({
                id: request.params.id,
                sessionId: request.query.sessionId,
                userId: request.principal.id,
            })
        },
    )

    app.delete(
        '/:id',
        DeleteChatConversationRequest,
        async (request, reply) => {
            await chatConversationService(request.log).delete({
                id: request.params.id,
                sessionId: request.query.sessionId,
                userId: request.principal.id,
            })
            await reply.code(StatusCodes.NO_CONTENT).send()
        },
    )
}



const CreateChatConversationRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-conversations'],
        summary: 'Create a new chat conversation',
        body: Type.Object({
            sessionId: ApId,
            conversation: Type.Optional(Type.Array(ConversationMessageSchema)),
        }),
        response: {
            [StatusCodes.CREATED]: ChatConversationSchema,
        },
    },
}

const UpdateChatConversationRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        tags: ['chat-conversations'],
        summary: 'Update chat conversation',
        body: Type.Object({
            sessionId: ApId,
            conversation: Type.Optional(Type.Array(ConversationMessageSchema)),
        }),
        response: {
            [StatusCodes.OK]: ChatConversationSchema,
        },
    },
}

const GetChatConversationRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-conversations'],
        summary: 'Get a specific chat conversation',
        params: Type.Object({
            id: ApId,
        }),
        querystring: Type.Object({
            sessionId: ApId,
        }),
        response: {
            [StatusCodes.OK]: ChatConversationSchema,
        },
    },
}

const ListChatConversationsRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-conversations'],
        summary: 'List all conversations for a session',
        params: Type.Object({
            sessionId: ApId,
        }),
        response: {
            [StatusCodes.OK]: Type.Array(ChatConversationSchema),
        },
    },
}

const DeleteChatConversationRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-conversations'],
        summary: 'Delete a chat conversation',
        params: Type.Object({
            id: ApId,
        }),
        querystring: Type.Object({
            sessionId: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}
