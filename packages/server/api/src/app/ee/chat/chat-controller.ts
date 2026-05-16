import {
    CreateChatConversationRequest,
    PrincipalType,
    SendChatMessageRequest,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { pipeUIMessageStreamToResponse } from 'ai'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { chatApprovalGate } from './chat-approval-gate'
import { chatService } from './chat-service'

const CHAT_PRINCIPALS = [PrincipalType.USER] as const

export const chatController: FastifyPluginAsyncZod = async (app) => {

    app.post('/conversations', CreateConversationRoute, async (request, reply) => {
        const conversation = await chatService(request.log).createConversation({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(conversation)
    })

    app.get('/conversations', ListConversationsRoute, async (request) => {
        return chatService(request.log).listConversations({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            cursor: request.query.cursor,
            limit: request.query.limit ?? 20,
        })
    })

    app.get('/conversations/:id', GetConversationRoute, async (request) => {
        return chatService(request.log).getConversationOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id', UpdateConversationRoute, async (request) => {
        return chatService(request.log).updateConversation({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
        })
    })

    app.delete('/conversations/:id', DeleteConversationRoute, async (request, reply) => {
        await chatService(request.log).deleteConversation({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/conversations/:id/messages', GetMessagesRoute, async (request) => {
        return chatService(request.log).getMessages({
            id: request.params.id,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

    app.post('/conversations/:id/messages', SendMessageRoute, async (request, reply) => {
        const { content, files } = request.body
        const log = request.log

        const { stream, closeMcpClient } = await chatService(log).sendMessage({
            conversationId: request.params.id,
            userId: request.principal.id,
            platformId: request.principal.platform.id,
            content,
            files,
        })

        await reply.hijack()

        try {
            pipeUIMessageStreamToResponse({
                response: reply.raw,
                stream,
                headers: {
                    'X-Accel-Buffering': 'no',
                },
            })
            await new Promise<void>((resolve) => {
                reply.raw.on('close', resolve)
            })
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

    app.post('/tool-approvals/:gateId', ToolApprovalRoute, async (request, reply) => {
        await chatApprovalGate.resolveGate({
            gateId: request.params.gateId,
            approved: request.body.approved,
        })
        return reply.status(StatusCodes.OK).send({ success: true })
    })

}

const CreateConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateChatConversationRequest,
    },
}

const ListConversationsRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: z.object({
            cursor: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
        }),
    },
}

const CONVERSATION_PARAMS = z.object({ id: z.string() })

const GetConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const UpdateConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        body: UpdateChatConversationRequest,
    },
}

const DeleteConversationRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const GetMessagesRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
    },
}

const SendMessageRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: CONVERSATION_PARAMS,
        body: SendChatMessageRequest,
    },
}

const ToolApprovalRoute = {
    config: {
        security: securityAccess.publicPlatform(CHAT_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({ gateId: z.string() }),
        body: z.object({ approved: z.boolean() }),
    },
}

