import {
    apId,
    ChatConversation,
    ChatHistoryMessage,
    CreateChatConversationRequest,
    PersistedChatMessage,
    SeekPage,
    spreadIfDefined,
    UpdateChatConversationRequest,
    ActivepiecesError,
    ErrorCode,
    isNil,
} from '@activepieces/shared'
import { ModelMessage, streamText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { mcpProjectSelection } from '../../mcp/mcp-project-selection'
import { projectLimitsService } from '../projects/project-plan/project-plan.service'
import { projectService } from '../../project/project-service'
import { aiUtils } from '../../ai/ai-utils'
import { flagService } from '../../flags/flag.service'
import { userService } from '../../user/user-service'
import { chatCompaction } from './chat-compaction'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatHelpers } from './chat-helpers'
import { chatHistory } from './history/chat-history'
import { chatMcp } from './mcp/chat-mcp'
import { chatPrompt } from './prompt/chat-prompt'
import { createChatTools } from './tools/chat-tools'
import { createChatModel, resolveDefaultChatModel } from './chat-model'
import { createUIMessageStream, SendMessageResult } from './chat-stream'
import { stripThinkingBlocks } from './utils/strip-thinking-blocks'
import { stepCountIs } from './utils/step-count-is'
import { buildSystemPromptWithCaching } from './prompt/build-system-prompt-with-caching'
import { buildProviderOptions } from './utils/build-provider-options'
import { resolveCompactionState } from './chat-compaction-resolver'
import { buildUserContentWithFiles } from './chat-file-utils'
import { AIProviderName } from '@activepieces/shared'

const MAX_STEPS = 10

export const chatService = (log: FastifyBaseLogger) => ({
    async createConversation({ platformId, userId, request }: CreateConversationParams): Promise<ChatConversation> {
        const conversation = await chatHelpers.conversationRepo().save({
            id: apId(),
            platformId,
            projectId: null,
            userId,
            title: request.title ?? null,
            modelName: request.modelName ?? null,
            messages: [],
        })
        log.info({ conversationId: conversation.id, platformId, userId }, '[chatService] Conversation created')
        return conversation
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

        const queryBuilder = chatHelpers.conversationRepo()
            .createQueryBuilder('chat_conversation')
            .where({ platformId, userId })

        const { data, cursor: paginationCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(data, paginationCursor)
    },

    async getConversationOrThrow({ id, platformId, userId }: ConversationIdentifier): Promise<ChatConversation> {
        return chatHelpers.getConversationOrThrow({ id, platformId, userId })
    },

    async updateConversation({ id, platformId, userId, request }: UpdateConversationParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        const updates = {
            ...spreadIfDefined('title', request.title),
            ...spreadIfDefined('modelName', request.modelName),
        }

        if (Object.keys(updates).length > 0) {
            await chatHelpers.conversationRepo().update(conversation.id, updates)
        }
        return { ...conversation, ...updates }
    },

    async deleteConversation({ id, platformId, userId }: ConversationIdentifier): Promise<void> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        await chatHelpers.conversationRepo().delete(conversation.id)
        log.info({ conversationId: id, platformId, userId }, '[chatService] Conversation deleted')
    },

    async getMessages({ id, platformId, userId }: ConversationIdentifier): Promise<{ data: PersistedChatMessage[] | ChatHistoryMessage[] }> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (conversation.uiMessages) {
            return { data: conversation.uiMessages }
        }
        const messages = chatHistory.reconstruct(conversation.messages as ModelMessage[])
        return { data: messages }
    },

    async setProjectContext({ id, platformId, userId, projectId }: SetProjectContextParams): Promise<ChatConversation> {
        const conversation = await this.getConversationOrThrow({ id, platformId, userId })
        if (projectId !== null) {
            await assertUserHasProjectAccess({ platformId, userId, projectId, log })
        }
        await chatHelpers.conversationRepo().update(conversation.id, { projectId })
        return { ...conversation, projectId }
    },

    async sendMessage({ conversationId, userId, platformId, content, files }: SendMessageParams): Promise<SendMessageResult> {
        const [conversation, providerConfig, userProjects, mcpCredentials, userContent] = await Promise.all([
            this.getConversationOrThrow({ id: conversationId, platformId, userId }),
            chatHelpers.resolveChatProvider({ platformId, log }),
            chatHelpers.getUserProjects({ platformId, userId, log }),
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

        const frontendUrl = system.get(AppSystemProp.FRONTEND_URL)
        const systemPrompt = chatPrompt.buildSystemPrompt({
            projects: userProjects,
            currentProjectId: selectedProjectId,
            frontendUrl,
        })
        const previousMessages = conversation.messages as ModelMessage[]
        const newUserMessage: ModelMessage = { role: 'user' as const, content: userContent }
        const allMessages = [...previousMessages, newUserMessage]

        await chatHelpers.conversationRepo().update(conversationId, { messages: allMessages })

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
                await chatHelpers.conversationRepo().update(conversationId, { projectId })
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
                            await chatHelpers.conversationRepo().update(conversationId, {
                                messages: updatedMessages,
                                ...(pendingTitle ? { title: pendingTitle } : {}),
                                ...(isNil(conversation.modelName) ? { modelName } : {}),
                            })
                        }
                        catch (saveErr) {
                            log.error({ err: saveErr, conversationId }, 'Failed to persist conversation messages')
                        }

                        try {
                            if (flagService(log).aiCreditsEnabled() && providerConfig.provider === AIProviderName.ACTIVEPIECES && selectedProjectId) {
                                const credits = aiUtils.calculateCredits(usage)
                                await projectLimitsService(log).incrementAiUsage(selectedProjectId, credits)
                            }
                        }
                        catch (creditErr) {
                            log.error({ err: creditErr, projectId: selectedProjectId }, 'Failed to increment AI usage credits')
                        }

                        log.info({
                            conversationId,
                            inputTokens: usage.inputTokens,
                            outputTokens: usage.outputTokens,
                            ...spreadIfDefined('cacheReadTokens', usage.inputTokenDetails?.cacheReadTokens),
                            ...spreadIfDefined('cacheWriteTokens', usage.inputTokenDetails?.cacheWriteTokens),
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

async function assertUserHasProjectAccess({ platformId, userId, projectId, log }: { platformId: string, userId: string, projectId: string, log: FastifyBaseLogger }) {
    const projects = await chatHelpers.getUserProjects({ platformId, userId, log })
    if (!projects.some((p) => p.id === projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: `User ${userId} does not have access to project ${projectId}` },
        })
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

type SendMessageParams = ConversationIdentifier & {
    content: string
    files: any[]
}
