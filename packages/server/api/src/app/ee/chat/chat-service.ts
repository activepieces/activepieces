import {
    ACTIVEPIECES_CHAT_TIERS,
    ActivepiecesError,
    AIProviderModelType,
    AIProviderName,
    ALLOWED_CHAT_MODELS_BY_PROVIDER,
    apId,
    ChatConversation,
    ChatHistoryMessage,
    CreateChatConversationRequest,
    ErrorCode,
    GetProviderConfigResponse,
    isNil,
    Project,
    ProjectType,
    SeekPage,
    spreadIfDefined,
    UpdateChatConversationRequest,
} from '@activepieces/shared'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createUIMessageStream, LanguageModel, ModelMessage, stepCountIs, streamText, SystemModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { mcpProjectSelection } from '../../mcp/mcp-project-selection'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { chatCompaction } from './chat-compaction'
import { ChatConversationEntity } from './chat-conversation-entity'
import { buildUserContentWithFiles } from './chat-file-utils'
import { createChatModel } from './chat-model-factory'
import { chatHistory } from './history/chat-history'
import { chatMcp } from './mcp/chat-mcp'
import { chatPrompt } from './prompt/chat-prompt'
import { createChatTools } from './tools/chat-tools'

const conversationRepo = repoFactory(ChatConversationEntity)

const MAX_STEPS = 30

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ platformId, userId, request }: CreateConversationParams): Promise<ChatConversation> {
        return conversationRepo().save({
            id: apId(),
            platformId,
            projectId: null,
            userId,
            title: request.title ?? null,
            modelName: request.modelName ?? null,
            messages: [],
        })
    },

    async listConversations({ platformId, userId, cursor, limit }: ListConversationsParams): Promise<SeekPage<ChatConversation>> {
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
            .where({ platformId, userId })

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, platformId, userId }: ConversationIdentifier): Promise<ChatConversation> {
        const conversation = await conversationRepo().findOneBy({ id, platformId, userId })
        if (isNil(conversation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'ChatConversation' },
            })
        }
        return conversation
    },

    async updateConversation({ id, platformId, userId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        const updates = {
            ...spreadIfDefined('title', request.title),
            ...spreadIfDefined('modelName', request.modelName),
        }

        if (Object.keys(updates).length > 0) {
            await conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, platformId, userId }: ConversationIdentifier): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        await conversationRepo().delete(conversation.id)
    },

    async getMessages({ id, platformId, userId }: ConversationIdentifier): Promise<{ data: ChatHistoryMessage[] }> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        const messages = chatHistory.reconstruct(conversation.messages as ModelMessage[])
        return { data: messages }
    },

    async setProjectContext({ id, platformId, userId, projectId }: SetProjectContextParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (projectId !== null) {
            await assertUserHasProjectAccess({ platformId, userId, projectId, log })
        }
        await conversationRepo().update(conversation.id, { projectId })
        return { ...conversation, projectId }
    },

    async sendMessage({ conversationId, userId, platformId, content, files }: SendMessageParams): Promise<SendMessageResult> {
        const [conversation, providerConfig, userProjects, mcpCredentials, userContent] = await Promise.all([
            this.getConversationOrThrow({ id: conversationId, platformId, userId }),
            resolveChatProvider({ platformId, log }),
            getUserProjects({ platformId, userId, log }),
            chatMcp.getCredentials({ platformId, userId, log }),
            buildUserContentWithFiles({ text: content, files }),
        ])

        const candidateProjectId = conversation.projectId ?? null
        const selectedProjectId = candidateProjectId && userProjects.some((p) => p.id === candidateProjectId)
            ? candidateProjectId
            : null

        const modelName = conversation.modelName
            ?? await resolveDefaultChatModel({ platformId, provider: providerConfig.provider, log })

        const { mcpClient, mcpToolSet } = await chatMcp.connectClient({ mcpCredentials, log })

        if (selectedProjectId) {
            mcpProjectSelection.set({ platformId, userId, projectId: selectedProjectId })
        }
        else {
            mcpProjectSelection.clear({ platformId, userId })
        }

        const model = createChatModel({
            provider: providerConfig.provider,
            auth: providerConfig.auth,
            config: providerConfig.config,
            modelId: modelName,
        })

        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        const systemPrompt = chatPrompt.buildSystemPrompt({
            projects: userProjects,
            currentProjectId: selectedProjectId,
            frontendUrl,
        })
        const previousMessages = conversation.messages as ModelMessage[]
        const newUserMessage: ModelMessage = { role: 'user' as const, content: userContent }
        const allMessages = [...previousMessages, newUserMessage]

        await conversationRepo().update(conversationId, { messages: allMessages })

        const compactionState = await resolveCompactionState({
            conversation,
            allMessages,
            systemPromptLength: systemPrompt.length,
            provider: providerConfig.provider,
            model,
            conversationId,
            log,
        })

        const messagesForLlm = chatCompaction.buildCompactedPayload({
            messages: allMessages,
            summary: compactionState.summary,
            summarizedUpToIndex: compactionState.summarizedUpToIndex,
            provider: providerConfig.provider,
        })

        let pendingTitle = ''
        const localTools = createChatTools({
            onSessionTitle: (title) => {
                pendingTitle = title
            },
            onSetProjectContext: async (projectId) => {
                await conversationRepo().update(conversationId, { projectId })
                if (projectId) {
                    mcpProjectSelection.set({ platformId, userId, projectId })
                }
                else {
                    mcpProjectSelection.clear({ platformId, userId })
                }
            },
            projects: userProjects,
            platformId,
            log,
        })

        const closeMcpClient = async (): Promise<void> => {
            if (mcpClient) {
                await mcpClient.close().catch((err: unknown) => {
                    log.warn({ err }, 'Failed to close MCP client')
                })
            }
        }

        const stream = createUIMessageStream({
            execute: ({ writer }) => {
                const gatedTools = chatMcp.withApprovalGates({ mcpToolSet, writer, log })
                const tools = { ...localTools, ...gatedTools }

                const sanitizedMessages = stripThinkingBlocks(messagesForLlm)
                const textStream = streamText({
                    model,
                    system: buildSystemPromptWithCaching({ systemPrompt, provider: providerConfig.provider }),
                    messages: sanitizedMessages,
                    tools,
                    providerOptions: buildProviderOptions({ provider: providerConfig.provider, modelId: modelName }),
                    stopWhen: stepCountIs(MAX_STEPS),
                    onStepFinish: ({ finishReason, usage }) => {
                        log.debug({ conversationId, finishReason, usage }, 'Chat step finished')
                    },
                    onFinish: async ({ response, usage }) => {
                        const updatedMessages = [...allMessages, ...response.messages]
                        try {
                            await conversationRepo().update(conversationId, {
                                messages: updatedMessages,
                                ...(pendingTitle ? { title: pendingTitle } : {}),
                                ...(isNil(conversation.modelName) ? { modelName } : {}),
                            })
                        }
                        catch (saveErr) {
                            log.error({ err: saveErr, conversationId }, 'Failed to persist conversation messages')
                        }

                        log.info({
                            conversationId,
                            inputTokens: usage.inputTokens,
                            outputTokens: usage.outputTokens,
                            ...spreadIfDefined('cacheReadTokens', usage.inputTokenDetails.cacheReadTokens),
                            ...spreadIfDefined('cacheWriteTokens', usage.inputTokenDetails.cacheWriteTokens),
                            provider: providerConfig.provider,
                        }, 'Chat message completed')
                    },
                    onError: ({ error }) => {
                        log.error({ err: error, conversationId }, 'Chat streamText error')
                    },
                })

                writer.merge(textStream.toUIMessageStream())
            },
        })

        return { stream, closeMcpClient }
    },

})

async function getUserProjects({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<Project[]> {
    const user = await userService(log).getOneOrFail({ id: userId })
    const allProjects = await projectService(log).getAllForUser({
        platformId,
        userId,
        isPrivileged: userService(log).isUserPrivileged(user),
    })
    return allProjects.filter(
        (p) => p.type !== ProjectType.PERSONAL || p.ownerId === userId,
    )
}

async function assertUserHasProjectAccess({ platformId, userId, projectId, log }: {
    platformId: string
    userId: string
    projectId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const userProjects = await getUserProjects({ platformId, userId, log })
    if (!userProjects.some((p) => p.id === projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: projectId, entityType: 'Project' },
        })
    }
}

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

async function resolveCompactionState({ conversation, allMessages, systemPromptLength, provider, model, conversationId, log }: {
    conversation: ChatConversation
    allMessages: ModelMessage[]
    systemPromptLength: number
    provider: AIProviderName
    model: LanguageModel
    conversationId: string
    log: FastifyBaseLogger
}): Promise<{ summary: string | null, summarizedUpToIndex: number | null }> {
    const summary = conversation.summary ?? null
    const summarizedUpToIndex = conversation.summarizedUpToIndex ?? null

    const estimatedTokens = chatCompaction.estimateTokenCount({
        messages: allMessages,
        systemPromptLength,
    })

    if (!chatCompaction.shouldCompact({ estimatedTokens, provider, messageCount: allMessages.length })) {
        return { summary, summarizedUpToIndex }
    }

    const result = await chatCompaction.compactMessages({
        messages: allMessages,
        existingSummary: summary,
        summarizedUpToIndex,
        provider,
        model,
        log,
    })

    await conversationRepo().update(conversationId, {
        summary: result.summary,
        summarizedUpToIndex: result.summarizedUpToIndex,
    })
    log.info({ conversationId, summarizedUpToIndex: result.summarizedUpToIndex }, 'Chat compaction completed')

    return result
}

function stripThinkingBlocks(messages: ModelMessage[]): ModelMessage[] {
    const hasThinking = messages.some(
        (msg) => msg.role === 'assistant' && Array.isArray(msg.content)
            && (msg.content as Array<Record<string, unknown>>).some(
                (part) => part.type === 'reasoning' || part.type === 'thinking',
            ),
    )
    if (!hasThinking) return messages

    return messages
        .map((msg) => {
            if (msg.role !== 'assistant' || !Array.isArray(msg.content)) {
                return msg
            }
            const filtered = (msg.content as Array<Record<string, unknown>>).filter(
                (part) => part.type !== 'reasoning' && part.type !== 'thinking',
            )
            if (filtered.length === msg.content.length) {
                return msg
            }
            if (filtered.length === 0) return null
            return { ...msg, content: filtered }
        })
        .filter((msg): msg is ModelMessage => msg !== null)
}

const TIER_EFFORT: Record<string, { anthropicBudget: number, openrouterEffort: string }> = {
    fast: { anthropicBudget: 5_000, openrouterEffort: 'low' },
    smart: { anthropicBudget: 10_000, openrouterEffort: 'medium' },
    premium: { anthropicBudget: 20_000, openrouterEffort: 'high' },
}

const DEFAULT_EFFORT = TIER_EFFORT.smart

function resolveEffort({ modelId }: { modelId: string }): { anthropicBudget: number, openrouterEffort: string } {
    const tier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.modelId === modelId)
    if (tier) {
        return TIER_EFFORT[tier.id] ?? DEFAULT_EFFORT
    }
    return DEFAULT_EFFORT
}

const THINKING_CAPABLE_MODELS = new Set([
    'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5',
    'claude-sonnet-4.6', 'claude-opus-4.7', 'claude-haiku-4.5',
])

function supportsThinking({ modelId }: { modelId: string }): boolean {
    const bareModel = modelId.replace(/^[^/]+\//, '')
    return THINKING_CAPABLE_MODELS.has(bareModel)
}

function buildProviderOptions({ provider, modelId }: { provider: AIProviderName, modelId: string }): SharedV3ProviderOptions {
    const effort = supportsThinking({ modelId }) ? resolveEffort({ modelId }) : null

    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return {
                anthropic: {
                    ...(effort ? { thinking: { type: 'enabled', budgetTokens: effort.anthropicBudget } } : {}),
                },
            }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return {
                openrouter: {
                    cache_control: { type: 'ephemeral' },
                    ...(effort ? { reasoning: { effort: effort.openrouterEffort } } : {}),
                },
            }
        default:
            return {}
    }
}

function buildSystemPromptWithCaching({ systemPrompt, provider }: {
    systemPrompt: string
    provider: AIProviderName
}): string | SystemModelMessage {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return {
                role: 'system',
                content: systemPrompt,
                providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
            }
        default:
            return systemPrompt
    }
}

type CreateConversationParams = {
    platformId: string
    userId: string
    request: CreateChatConversationRequest
}

type ListConversationsParams = {
    platformId: string
    userId: string
    cursor?: string
    limit: number
}

type ConversationIdentifier = {
    id: string
    platformId: string
    userId: string
}

type UpdateConversationParams = ConversationIdentifier & {
    request: UpdateChatConversationRequest
}

type SetProjectContextParams = ConversationIdentifier & {
    projectId: string | null
}

type SendMessageParams = {
    conversationId: string
    userId: string
    platformId: string
    content: string
    files?: Array<{ name: string, mimeType: string, data: string }>
}

type SendMessageResult = {
    stream: ReadableStream
    closeMcpClient: () => Promise<void>
}
