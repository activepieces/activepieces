import { chatAiUtils } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    ChatConfigResponse,
    ChatConversationStatus,
    ErrorCode,
    ExecuteChatToolRequest,
    ExecuteChatToolResponse,
    GetChatConfigRequest,
    PersistedChatMessage,
    PersistedChatPartType,
    PersistedChatRole,
    sanitizeObjectForPostgresql,
    SaveChatMessagesRequest,
    UpdateChatProgressRequest,
    UpdateProjectContextRequest,
} from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { mcpProjectSelection } from '../../mcp/mcp-project-selection'
import { chatApprovalGate } from './chat-approval-gate'
import { chatCompaction } from './chat-compaction'
import { buildUserContentWithFiles } from './chat-file-utils'
import { chatHelpers } from './chat-helpers'
import { chatAnalyticsTelemetry } from './chat-sync-job'
import { chatMcp } from './mcp/chat-mcp'
import { chatPrompt } from './prompt/chat-prompt'
import { executeCrossProjectTool } from './tools/chat-tools'

export const chatRpcHandlers = (log: FastifyBaseLogger) => ({
    async getChatConfig(input: GetChatConfigRequest): Promise<ChatConfigResponse> {
        const { conversationId, platformId, userId, userMessage, modelName, files } = input

        const [conversation, providerConfig, userProjects, userContent, mcpCredentials] = await Promise.all([
            chatHelpers.getConversationOrThrow({ id: conversationId, platformId, userId }),
            chatHelpers.resolveChatProvider({ platformId, log }),
            chatHelpers.getUserProjects({ platformId, userId, log }),
            buildUserContentWithFiles({ text: userMessage, files }),
            chatMcp.getCredentials({ platformId, userId, log }),
        ])

        if (conversation.status === ChatConversationStatus.STREAMING) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'An agent is already running for this conversation' },
            })
        }

        const candidateProjectId = conversation.projectId ?? null
        const selectedProjectId = candidateProjectId && userProjects.some((p) => p.id === candidateProjectId)
            ? candidateProjectId
            : null

        const tier = chatHelpers.resolveTier({ tierId: modelName ?? conversation.modelName ?? null })
        const resolvedModelId = chatHelpers.resolveModelIdForProvider({ tier, provider: providerConfig.provider })

        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        const systemPromptText = chatPrompt.buildSystemPrompt({
            projects: userProjects,
            currentProjectId: selectedProjectId,
            frontendUrl,
        })

        const previousMessages = conversation.messages as ModelMessage[]
        const newUserMessage: ModelMessage = { role: 'user' as const, content: userContent }
        const allMessages = [...previousMessages, newUserMessage]

        const selectionScope = { conversationId }
        if (selectedProjectId) {
            await mcpProjectSelection.set({ scope: selectionScope, projectId: selectedProjectId })
        }
        else {
            await mcpProjectSelection.clear(selectionScope)
        }

        const previousUiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
        const uiMessagesWithUser: PersistedChatMessage[] = [
            ...previousUiMessages,
            { role: PersistedChatRole.USER, parts: [{ type: PersistedChatPartType.TEXT, text: userMessage }] },
        ]
        await chatHelpers.conversationRepo().update(conversationId, {
            messages: allMessages,
            uiMessages: JSON.parse(JSON.stringify(uiMessagesWithUser)),
            status: ChatConversationStatus.STREAMING,
        })

        const estimatedTokens = chatCompaction.estimateTokenCount({ messages: allMessages, systemPromptLength: systemPromptText.length })
        let compactionState = { summary: conversation.summary ?? null, summarizedUpToIndex: conversation.summarizedUpToIndex ?? null }

        if (chatCompaction.shouldCompact({ estimatedTokens, provider: providerConfig.provider, messageCount: allMessages.length })) {
            const model = chatAiUtils.createChatModel({
                provider: providerConfig.provider,
                auth: providerConfig.auth as Record<string, unknown>,
                config: providerConfig.config as Record<string, unknown>,
                modelId: resolvedModelId,
            })
            compactionState = await chatCompaction.compactMessages({
                messages: allMessages,
                existingSummary: compactionState.summary,
                summarizedUpToIndex: compactionState.summarizedUpToIndex,
                provider: providerConfig.provider,
                model,
                log,
            })
            await chatHelpers.conversationRepo().update(conversationId, {
                summary: compactionState.summary,
                summarizedUpToIndex: compactionState.summarizedUpToIndex,
            })
        }

        const messagesForLlm = chatCompaction.buildCompactedPayload({
            messages: allMessages,
            summary: compactionState.summary,
            summarizedUpToIndex: compactionState.summarizedUpToIndex,
            provider: providerConfig.provider,
        })

        return {
            provider: providerConfig.provider,
            auth: providerConfig.auth as Record<string, unknown>,
            providerConfig: providerConfig.config as Record<string, unknown>,
            modelId: resolvedModelId,
            systemPrompt: systemPromptText,
            messages: messagesForLlm,
            allMessages,
            previousUiMessages: uiMessagesWithUser,
            tier: { id: tier.id, thinkingBudget: tier.thinkingBudget, modelId: tier.modelId },
            mcpCredentials: mcpCredentials.mcpServerUrl && mcpCredentials.mcpToken
                ? { mcpServerUrl: mcpCredentials.mcpServerUrl, mcpToken: mcpCredentials.mcpToken }
                : null,
            projects: userProjects.map((p) => ({ id: p.id, displayName: p.displayName, type: p.type })),
        }
    },

    async saveChatMessages(input: SaveChatMessagesRequest): Promise<void> {
        const isSuccessfulCompletion = input.messages.length > 0
        const updates: Record<string, unknown> = {
            status: isSuccessfulCompletion ? ChatConversationStatus.IDLE : ChatConversationStatus.ERROR,
        }

        if (isSuccessfulCompletion) {
            updates.messages = input.messages
            updates.uiMessages = sanitizeObjectForPostgresql(input.uiMessages)
            if (input.title) updates.title = input.title
            if (input.modelName) updates.modelName = input.modelName
        }

        await chatHelpers.conversationRepo().update(input.conversationId, updates)

        if (input.messages.length > 0) {
            const conversation = await chatHelpers.conversationRepo().findOneBy({ id: input.conversationId })
            if (conversation) {
                chatAnalyticsTelemetry(log).sendConversationUpdate({ conversation })
            }
        }
    },

    async updateChatProgress(input: UpdateChatProgressRequest): Promise<void> {
        await chatHelpers.conversationRepo().update(input.conversationId, {
            uiMessages: JSON.parse(JSON.stringify(input.uiMessages)),
        })
    },

    async updateProjectContext(input: UpdateProjectContextRequest): Promise<void> {
        await chatHelpers.conversationRepo().update(input.conversationId, { projectId: input.projectId })
        const scope = { conversationId: input.conversationId }
        if (input.projectId) {
            await mcpProjectSelection.set({ scope, projectId: input.projectId })
        }
        else {
            await mcpProjectSelection.clear(scope)
        }
    },

    async executeChatTool(input: ExecuteChatToolRequest): Promise<ExecuteChatToolResponse> {
        if (input.toolName === '__approval_check') {
            const gateId = input.toolInput.gateId
            if (typeof gateId !== 'string') {
                return { result: false }
            }
            const decision = await chatApprovalGate.checkDecision({ gateId })
            return { result: decision }
        }

        const result = await executeCrossProjectTool({
            toolName: input.toolName,
            toolInput: input.toolInput,
            platformId: input.platformId,
            userId: input.userId,
            log,
        })
        return { result }
    },
})
