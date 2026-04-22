import {
    AIProviderName,
    ChatStreamEventType,
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
import { aiProviderService } from '../ai/ai-provider-service'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { chatSandboxAgent } from './chat-sandbox-agent'
import { chatService } from './chat-service'

const CHAT_PRINCIPALS = [PrincipalType.USER] as const

export const chatController: FastifyPluginAsyncZod = async (app) => {

    app.post('/conversations', CreateConversationRoute, async (request, reply) => {
        const conversation = await chatService(request.log).createConversation({
            projectId: request.projectId,
            userId: request.principal.id,
            platformId: request.principal.platform.id,
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
        const conversation = await chatService(request.log).getConversationOrThrow({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
        })

        if (!conversation.sandboxSessionId) {
            return { data: [] }
        }

        const config = await aiProviderService(request.log).getConfigOrThrow({
            platformId: request.principal.platform.id,
            provider: AIProviderName.ANTHROPIC,
        })

        const messages = await chatSandboxAgent.getSessionHistory({
            sessionId: conversation.sandboxSessionId,
            anthropicApiKey: config.auth.apiKey,
        })

        return { data: messages }
    })

    app.post('/conversations/:id/messages', SendMessageRoute, async (request, reply) => {
        const conversation = await chatService(request.log).getConversationOrThrow({
            id: request.params.id,
            projectId: request.projectId,
            userId: request.principal.id,
        })

        if (!conversation.sandboxSessionId) {
            return reply.status(StatusCodes.BAD_REQUEST).send({
                error: 'Conversation has no active session',
            })
        }

        const { content } = request.body
        const log = request.log
        const platformId = request.principal.platform.id

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        })

        let cleaned = false
        let unsubscribeEvent: (() => void) | null = null

        function cleanup(): void {
            if (cleaned) return
            cleaned = true
            unsubscribeEvent?.()
        }

        request.raw.on('close', cleanup)

        try {
            const config = await aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.ANTHROPIC })
            const anthropicApiKey = config.auth.apiKey
            const session = await chatSandboxAgent.resumeSession({
                sessionId: conversation.sandboxSessionId,
                anthropicApiKey,
            })

            if (cleaned) {
                reply.raw.end()
                return await reply
            }

            unsubscribeEvent = session.onEvent((event) => {
                if (cleaned) return
                if (event.sender !== 'agent') return

                const payload: unknown = event.payload
                if (!isPlainObject(payload)) return
                if (payload.method !== 'session/update') return
                if (!isPlainObject(payload.params)) return

                const update = payload.params.update
                if (!isPlainObject(update)) return

                handleSessionUpdate(reply.raw, update)
            })

            await chatSandboxAgent.sendPrompt({ session, text: content })

            if (!cleaned) {
                writeSseEvent(reply.raw, {
                    type: ChatStreamEventType.DONE,
                    data: {},
                })
            }
        }
        catch (error) {
            if (!cleaned) {
                log.error({ err: error }, 'Chat agent prompt failed')
                writeSseEvent(reply.raw, {
                    type: ChatStreamEventType.ERROR,
                    data: { message: 'An error occurred while processing your request' },
                })
            }
        }
        finally {
            cleanup()
            reply.raw.end()
        }

        return reply
    })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key]
    return typeof value === 'string' ? value : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
    const value = obj[key]
    return typeof value === 'number' ? value : undefined
}

function handleSessionUpdate(raw: NodeJS.WritableStream, update: Record<string, unknown>): void {
    if (update.sessionUpdate === 'agent_message_chunk' && isPlainObject(update.content) && update.content.type === 'text' && typeof update.content.text === 'string') {
        writeSseEvent(raw, {
            type: ChatStreamEventType.TEXT_CHUNK,
            data: { text: update.content.text },
        })
    }

    if (isPlainObject(update.toolCall)) {
        const toolCall = update.toolCall
        const status = getString(toolCall, 'status')
        const data = {
            toolCallId: getString(toolCall, 'toolCallId'),
            toolName: getString(toolCall, 'toolName'),
            status,
        }
        if (status === 'started' || status === 'running') {
            writeSseEvent(raw, { type: ChatStreamEventType.TOOL_CALL_START, data })
        }
        else if (status === 'completed') {
            writeSseEvent(raw, { type: ChatStreamEventType.TOOL_CALL_COMPLETE, data })
        }
        else {
            writeSseEvent(raw, { type: ChatStreamEventType.TOOL_CALL_UPDATE, data })
        }
    }

    if (isPlainObject(update.usage)) {
        writeSseEvent(raw, {
            type: ChatStreamEventType.USAGE_UPDATE,
            data: {
                inputTokens: getNumber(update.usage, 'inputTokens') ?? 0,
                outputTokens: getNumber(update.usage, 'outputTokens') ?? 0,
            },
        })
    }
}

function writeSseEvent(raw: NodeJS.WritableStream, event: { type: ChatStreamEventType, data: Record<string, unknown> }): void {
    const safeType = String(event.type).replace(/[\r\n]/g, '')
    raw.write(`event: ${safeType}\n`)
    raw.write(`data: ${JSON.stringify(event.data)}\n\n`)
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
