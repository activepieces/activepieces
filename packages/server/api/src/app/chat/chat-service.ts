import { ServerResponse } from 'http'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
    ActivepiecesError,
    AIProviderModelType,
    AIProviderName,
    ALLOWED_CHAT_MODELS_BY_PROVIDER,
    apId,
    ChatConversation,
    ChatHistoryMessage,
    ChatHistoryToolCall,
    CreateChatConversationRequest,
    ErrorCode,
    GetProviderConfigResponse,
    isNil,
    SeekPage,
    spreadIfDefined,
    tryCatch,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { ModelMessage, stepCountIs, streamText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { Order } from '../helper/pagination/paginator'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { mcpServerService } from '../mcp/mcp-service'
import { projectService } from '../project/project-service'
import { ChatConversationEntity } from './chat-conversation-entity'
import { buildUserContentWithFiles } from './chat-file-utils'
import { createChatModel } from './chat-model-factory'
import { createChatTools } from './chat-tools'

const conversationRepo = repoFactory(ChatConversationEntity)

const MAX_STEPS = 20

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ projectId, userId, request }: CreateConversationParams): Promise<ChatConversation> {
        return conversationRepo().save({
            id: apId(),
            projectId,
            userId,
            title: request.title ?? null,
            modelName: request.modelName ?? null,
            messages: [],
        })
    },

    async listConversations({ projectId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: ChatConversationEntity,
            query: {
                limit,
                orderBy: [
                    { field: 'created', order: Order.DESC },
                    { field: 'id', order: Order.DESC },
                ],
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = conversationRepo()
            .createQueryBuilder('chat_conversation')
            .where({ projectId, userId })

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, projectId, userId }: ConversationIdentifier): Promise<ChatConversation> {
        const conversation = await conversationRepo().findOneBy({ id, projectId, userId })
        if (isNil(conversation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'ChatConversation' },
            })
        }
        return conversation
    },

    async updateConversation({ id, projectId, userId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const updates = {
            ...spreadIfDefined('title', request.title),
            ...spreadIfDefined('modelName', request.modelName),
        }

        if (Object.keys(updates).length > 0) {
            await conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, projectId, userId }: ConversationIdentifier): Promise<void> {
        const result = await conversationRepo().delete({ id, projectId, userId })
        if (result.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'ChatConversation' },
            })
        }
    },

    async getMessages({ id, projectId, userId }: ConversationIdentifier): Promise<{ data: ChatHistoryMessage[] }> {
        const conversation = await this.getConversationOrThrow({ id, projectId, userId })
        const messages = reconstructChatHistory(conversation.messages as ModelMessage[])
        return { data: messages }
    },

    async sendMessage({ conversationId, projectId, userId, platformId, content, files }: SendMessageParams): Promise<SendMessageResult> {
        const [conversation, providerConfig, mcpCredentials, projectName, userContent] = await Promise.all([
            this.getConversationOrThrow({ id: conversationId, projectId, userId }),
            resolveChatProvider({ platformId, log }),
            getMcpCredentials({ projectId, log }),
            projectService(log).getOneOrThrow(projectId).then((p) => p.displayName),
            buildUserContentWithFiles({ text: content, files }),
        ])

        const modelName = conversation.modelName
            ?? await resolveDefaultChatModel({ platformId, provider: providerConfig.provider, log })

        const { mcpClient, mcpToolSet } = await connectMcpClient({ mcpCredentials, log })

        const model = createChatModel({
            provider: providerConfig.provider,
            auth: providerConfig.auth,
            config: providerConfig.config,
            modelId: modelName,
        })

        const systemPrompt = buildAgentSystemPrompt(projectName)
        const previousMessages = conversation.messages as ModelMessage[]
        const newUserMessage: ModelMessage = { role: 'user' as const, content: userContent }
        const allMessages = [...previousMessages, newUserMessage]

        let pendingTitle = ''
        const localTools = createChatTools({
            onSessionTitle: (title) => {
                pendingTitle = title 
            },
            onPlanUpdate: () => {},
        })
        const tools = { ...localTools, ...mcpToolSet }

        const closeMcpClient = async (): Promise<void> => {
            if (mcpClient) {
                await mcpClient.close().catch((err: unknown) => {
                    log.warn({ err }, 'Failed to close MCP client')
                })
            }
        }

        try {
            const result = streamText({
                model,
                system: systemPrompt,
                messages: allMessages,
                tools,
                stopWhen: stepCountIs(MAX_STEPS),
                onStepFinish: ({ finishReason, usage }) => {
                    log.debug({ conversationId, finishReason, usage }, 'Chat step finished')
                },
                onFinish: async ({ response, usage }) => {
                    const updatedMessages = [...allMessages, ...response.messages]
                    await conversationRepo().update(conversationId, {
                        messages: updatedMessages,
                        ...(pendingTitle ? { title: pendingTitle } : {}),
                        ...(isNil(conversation.modelName) ? { modelName } : {}),
                    })

                    log.info({
                        conversationId,
                        inputTokens: usage.inputTokens,
                        outputTokens: usage.outputTokens,
                        provider: providerConfig.provider,
                    }, 'Chat message completed')
                },
                onError: ({ error }) => {
                    log.error({ err: error, conversationId }, 'Chat streamText error')
                },
            })

            return { result, closeMcpClient }
        }
        catch (err) {
            await closeMcpClient()
            throw err
        }
    },

})

async function resolveChatProvider({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<GetProviderConfigResponse> {
    const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
    if (isNil(chatProvider)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: platformId, entityType: 'ChatAiProvider' },
        })
    }
    return chatProvider
}

async function resolveDefaultChatModel({ platformId, provider, log }: {
    platformId: string
    provider: AIProviderName
    log: FastifyBaseLogger
}): Promise<string> {
    const allModels = await aiProviderService(log).listModels(platformId, provider)
    const textModels = allModels.filter((m) => m.type === AIProviderModelType.TEXT)
    const allowedIds = ALLOWED_CHAT_MODELS_BY_PROVIDER[provider]
    if (allowedIds) {
        const firstAllowed = textModels.find((m) => allowedIds.includes(m.id))
        if (firstAllowed) return firstAllowed.id
    }
    const firstText = textModels[0]
    if (firstText) return firstText.id
    throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { entityId: provider, entityType: 'AIProviderTextModel' },
    })
}

async function connectMcpClient({ mcpCredentials, log }: {
    mcpCredentials: { mcpServerUrl: string | null, mcpToken: string | null }
    log: FastifyBaseLogger
}): Promise<{ mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null, mcpToolSet: Record<string, unknown> }> {
    if (isNil(mcpCredentials.mcpServerUrl) || isNil(mcpCredentials.mcpToken)) {
        return { mcpClient: null, mcpToolSet: {} }
    }
    const mcpUrl = mcpCredentials.mcpServerUrl
    const mcpToken = mcpCredentials.mcpToken
    const { data: client, error } = await tryCatch(async () => createMCPClient({
        transport: {
            type: 'http',
            url: mcpUrl,
            headers: { 'Authorization': `Bearer ${mcpToken}` },
        },
    }))
    if (isNil(client)) {
        log.warn({ err: error }, 'Failed to create MCP client — chat will work without MCP tools')
        return { mcpClient: null, mcpToolSet: {} }
    }
    const mcpToolSet = await client.tools()
    return { mcpClient: client, mcpToolSet }
}

async function getMcpCredentials({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<{ mcpServerUrl: string | null, mcpToken: string | null }> {
    const { data: mcpServer, error } = await tryCatch(async () => mcpServerService(log).getByProjectId(projectId))
    if (error) {
        log.warn({ err: error, projectId }, 'Failed to get MCP credentials — chat will work without MCP tools')
        return { mcpServerUrl: null, mcpToken: null }
    }
    const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
    const mcpServerUrl = `${frontendUrl}/mcp`
    return {
        mcpServerUrl,
        mcpToken: mcpServer.token,
    }
}

function reconstructChatHistory(messages: ModelMessage[]): ChatHistoryMessage[] {
    const result: ChatHistoryMessage[] = []

    for (const msg of messages) {
        if (msg.role === 'user') {
            const textContent = extractTextFromContent(msg.content)
            if (textContent) {
                result.push({ role: 'user', content: textContent })
            }
        }
        else if (msg.role === 'assistant') {
            const parts = Array.isArray(msg.content) ? msg.content : [{ type: 'text' as const, text: String(msg.content) }]
            let text = ''
            const toolCalls: ChatHistoryToolCall[] = []

            for (const part of parts) {
                if (typeof part === 'string') {
                    text += part
                }
                else if (part.type === 'text') {
                    text += part.text
                }
                else if (part.type === 'tool-call') {
                    toolCalls.push({
                        toolCallId: part.toolCallId,
                        title: part.toolName,
                        status: 'completed',
                        input: typeof part.input === 'object' && part.input !== null ? part.input as Record<string, unknown> : undefined,
                    })
                }
            }

            if (text || toolCalls.length > 0) {
                result.push({
                    role: 'assistant',
                    content: text,
                    ...(toolCalls.length > 0 ? { toolCalls } : {}),
                })
            }
        }
        else if (msg.role === 'tool') {
            const lastAssistant = result[result.length - 1]
            if (lastAssistant?.role === 'assistant' && lastAssistant.toolCalls) {
                const toolResults = Array.isArray(msg.content) ? msg.content : []
                for (const toolResult of toolResults) {
                    if (typeof toolResult === 'object' && toolResult !== null && 'type' in toolResult && toolResult.type === 'tool-result') {
                        const tr = toolResult as { toolCallId: string, output: unknown }
                        const existing = lastAssistant.toolCalls.find((tc) => tc.toolCallId === tr.toolCallId)
                        if (existing) {
                            existing.output = typeof tr.output === 'string'
                                ? tr.output
                                : JSON.stringify(tr.output)
                            existing.status = 'completed'
                        }
                    }
                }
            }
        }
    }

    return result
}

function extractTextFromContent(content: unknown): string {
    if (typeof content === 'string') return content
    if (!Array.isArray(content)) return ''
    let text = ''
    for (const part of content) {
        if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'text' && 'text' in part) {
            text += part.text
        }
    }
    return text
}

function sanitizeProjectName(name: string): string {
    return name.replace(/[^a-zA-Z0-9 \-_.]/g, '').slice(0, 64)
}

const SYSTEM_PROMPT_TEMPLATE = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-system-prompt.md'),
    'utf8',
)

function buildAgentSystemPrompt(projectName: string): string {
    return SYSTEM_PROMPT_TEMPLATE.replace('{{PROJECT_NAME}}', sanitizeProjectName(projectName))
}

type CreateConversationParams = {
    projectId: string
    userId: string
    request: CreateChatConversationRequest
}

type ListConversationsParams = {
    projectId: string
    userId: string
    cursor?: string
    limit: number
}

type ConversationIdentifier = {
    id: string
    projectId: string
    userId: string
}

type UpdateConversationParams = ConversationIdentifier & {
    request: UpdateChatConversationRequest
}

type SendMessageParams = {
    conversationId: string
    projectId: string
    userId: string
    platformId: string
    content: string
    files?: Array<{ name: string, mimeType: string, data: string }>
}

type SendMessageResult = {
    result: {
        pipeUIMessageStreamToResponse(response: ServerResponse, options?: Record<string, unknown>): void
        consumeStream(): PromiseLike<void>
    }
    closeMcpClient: () => Promise<void>
}

