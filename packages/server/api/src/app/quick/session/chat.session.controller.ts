import { securityAccess } from '@activepieces/server-shared'
import { ApId, ChatSession, ChatWithQuickRequest, CreateChatSessionRequest, PrincipalType, ToggleSearchToolRequest, UpdateChatSessionRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { chatSessionService } from './chat.session.service'

export const chatSessionController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateChatSessionRequestConfig, async (request) => {
        const session = await chatSessionService(request.log).create(request.principal.id)
        return session
    })

    app.post('/:id/update-model', UpdateChatSessionModelRequestConfig, async (request) => {
        return chatSessionService(request.log).updateSessionModel({ id: request.params.id, modelId: request.body.modelId, userId: request.principal.id })
    })

    app.post('/:id/toggle-search-tool', ToggleSearchToolRequestConfig, async (request) => {
        return chatSessionService(request.log).toggleSearchTool({ id: request.params.id, enabled: request.body.enabled, userId: request.principal.id })
    })

    app.get(
        '/:id',
        GetChatSessionRequest,
        async (request) => {

            return chatSessionService(request.log).getOneOrThrow({
                id: request.params.id,
                userId: request.principal.id,
            })
        },
    )

    app.post(
        '/:id/chat',
        ChatWithSessionRequest,
        async (request) => {
            await chatSessionService(request.log).chatWithSession({
                platformId: request.principal.platform.id,
                userId: request.principal.id,
                sessionId: request.params.id,
                message: request.body.message,
            })
        },
    )

    app.delete(
        '/:id',
        DeleteChatSessionRequest,
        async (request, reply) => {
            await chatSessionService(request.log).delete({
                id: request.params.id,
                userId: request.principal.id,
            })
            reply.code(StatusCodes.NO_CONTENT).send()
        },
    )
}


const CreateChatSessionRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Create a new chat session',
        body: CreateChatSessionRequest,
        response: {
            [StatusCodes.CREATED]: ChatSession,
        },
    },
}

const ChatWithSessionRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        tags: ['chat-sessions'],
        body: ChatWithQuickRequest,
        summary: 'Chat with a session',
    },
}

const UpdateChatSessionModelRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        tags: ['chat-sessions'],
        summary: 'Update chat session',
        body: UpdateChatSessionRequest,
        response: {
            [StatusCodes.OK]: ChatSession,
        },
    },
}

const ToggleSearchToolRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        tags: ['chat-sessions'],
        summary: 'Update chat session',
        body: ToggleSearchToolRequest,
        response: {
            [StatusCodes.OK]: ChatSession,
        },
    },
}

const GetChatSessionRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
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
        security: securityAccess.unscoped([PrincipalType.USER]),
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