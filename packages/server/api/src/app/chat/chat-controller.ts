import {
    CreateChatConversationRequest,
    isObject,
    Permission,
    PrincipalType,
    SendChatMessageRequest,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { createUIMessageStream, pipeUIMessageStreamToResponse } from 'ai'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { chatSandboxAgent } from './sandbox/sandbox-agent'
import { ChatUIMessage, createHistoryReplayFilter, createStreamWriter } from './sandbox/stream-adapter'
import { chatService } from './chat-service'

const CHAT_PRINCIPALS = [PrincipalType.USER] as const

export const chatController: FastifyPluginAsyncZod = async (app) => {

    app.post('/warm', WarmRoute, async (request, reply) => {
        void chatService(request.log).warmSandbox({ platformId: request.principal.platform.id })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

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
            platformId: request.principal.platform.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/conversations/:id/messages', GetMessagesRoute, async (request) => {
        return chatService(request.log).getMessages({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
            platformId: request.principal.platform.id,
        })
    })

    app.post('/conversations/:id/messages', SendMessageRoute, async (request, reply) => {
        const { content, files } = request.body
        const log = request.log
        const platformId = request.principal.platform.id
        const conversationId = request.params.id
        const projectId = request.projectId
        const userId = request.principal.id

        const conversation = await chatService(log).ensureSession({
            id: conversationId,
            projectId,
            userId,
            platformId,
        })
        if (!conversation.sandboxSessionId) {
            return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                error: 'Failed to create sandbox session',
            })
        }
        const sandboxSessionId = conversation.sandboxSessionId

        await reply.hijack()

        const stream = createUIMessageStream<ChatUIMessage>({
            execute: async ({ writer }) => {
                writer.write({ type: 'start' })

                const [anthropicApiKey, systemPrompt] = await Promise.all([
                    chatService(log).getAnthropicApiKey({ platformId }),
                    chatService(log).buildSystemPrompt({ projectId }),
                ])

                const session = await chatSandboxAgent.resumeSession({
                    sessionId: sandboxSessionId,
                    anthropicApiKey,
                })

                const historyReplayFilter = createHistoryReplayFilter()
                const streamWriter = createStreamWriter({
                    writer,
                    textPartId: 'text',
                    reasoningPartId: 'reasoning',
                    onSessionTitle: (title) => {
                        void chatService(log).updateConversation({
                            id: conversationId,
                            projectId,
                            userId,
                            request: { title },
                        })
                    },
                })
                let unsubscribe: (() => void) | undefined

                try {
                    await new Promise<void>((resolve, reject) => {
                        unsubscribe = session.onEvent((event) => {
                            if (event.sender !== 'agent') return

                            const payload: unknown = event.payload
                            if (!isObject(payload) || payload.method !== 'session/update') return
                            if (!isObject(payload.params)) return

                            const update = payload.params.update
                            if (!isObject(update)) return

                            if (historyReplayFilter.shouldSuppress(update)) return

                            streamWriter.write(update)
                        })

                        chatSandboxAgent.sendPrompt({ session, text: content, systemPrompt, files })
                            .then(resolve)
                            .catch(reject)
                    })
                }
                finally {
                    unsubscribe?.()
                }

                writer.write({ type: 'finish', finishReason: 'stop' })
            },
            onError: (error) => {
                log.error({ err: error }, 'Chat agent prompt failed')
                return 'An error occurred while processing your request'
            },
        })

        pipeUIMessageStreamToResponse({
            response: reply.raw,
            stream,
            headers: {
                'X-Accel-Buffering': 'no',
            },
        })
    })
}

const WarmRoute = {
    config: {
        security: securityAccess.project(CHAT_PRINCIPALS, Permission.READ_CHAT, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        querystring: z.object({ projectId: z.string() }),
    },
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
