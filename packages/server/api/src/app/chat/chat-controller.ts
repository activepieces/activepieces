import {
    CreateChatConversationRequest,
    Permission,
    PrincipalType,
    SendChatMessageRequest,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { chatService } from './chat-service'

const CHAT_PRINCIPALS = [PrincipalType.USER] as const

export const chatController: FastifyPluginAsyncZod = async (app) => {

    app.post('/conversations', CreateConversationRoute, async (request, reply) => {
        const conversation = await chatService(request.log).createConversation({
            projectId: request.projectId,
            userId: request.principal.id,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(conversation)
    })

    app.get('/conversations', ListConversationsRoute, async (request) => {
        return chatService(request.log).listConversations({
            projectId: request.projectId,
            userId: request.principal.id,
            cursor: request.query.cursor,
            limit: request.query.limit ?? 20,
        })
    })

    app.get('/conversations/:id', GetConversationRoute, async (request) => {
        return chatService(request.log).getConversationOrThrow({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id', UpdateConversationRoute, async (request) => {
        return chatService(request.log).updateConversation({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
            request: request.body,
        })
    })

    app.delete('/conversations/:id', DeleteConversationRoute, async (request, reply) => {
        await chatService(request.log).deleteConversation({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/conversations/:id/messages', GetMessagesRoute, async (request) => {
        return chatService(request.log).getMessages({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id/messages', SendMessageRoute, async (request, reply) => {
        const { content, files } = request.body
        const log = request.log

        const { result, closeMcpClient } = await chatService(log).sendMessage({
            conversationId: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
            platformId: request.principal.platform.id,
            content,
            files,
        })

        await reply.hijack()

        try {
            result.pipeUIMessageStreamToResponse(reply.raw, {
                headers: {
                    'X-Accel-Buffering': 'no',
                },
            })
            await result.consumeStream()
        }
        catch (err: unknown) {
            const isClientDisconnect = err instanceof Error && 'code' in err && err.code === 'ECONNRESET'
            if (isClientDisconnect) {
                log.debug({ err }, 'Chat stream ended (client disconnect)')
            }
            else {
                log.error({ err }, 'Chat stream error')
            }
        }
        finally {
            await closeMcpClient()
        }
    })
}

const CreateConversationRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.WRITE_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({ projectId: z.string() }),
        body: CreateChatConversationRequest,
    },
}

const ListConversationsRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.READ_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            projectId: z.string(),
            cursor: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
        }),
    },
}

const CONVERSATION_QUERY = z.object({ projectId: z.string() })
const CONVERSATION_PARAMS = z.object({ id: z.string() })

const GetConversationRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.READ_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: CONVERSATION_QUERY,
    },
}

const UpdateConversationRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.WRITE_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: CONVERSATION_QUERY,
        body: UpdateChatConversationRequest,
    },
}

const DeleteConversationRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.WRITE_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: CONVERSATION_QUERY,
    },
}

const GetMessagesRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.READ_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: CONVERSATION_QUERY,
    },
}

const SendMessageRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.WRITE_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        querystring: CONVERSATION_QUERY,
        body: SendChatMessageRequest,
    },
}
