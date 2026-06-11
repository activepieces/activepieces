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
import { chatApprovalGate } from './chat-approval-gate'
import { chatCompaction } from './chat-compaction'
import { buildUserContentWithFiles } from './chat-file-utils'
import { chatHelpers } from './chat-helpers'
import { chatHistoryHygiene } from './chat-history-hygiene'
import { chatAnalyticsTelemetry } from './chat-sync-job'
import { chatMcp } from './mcp/chat-mcp'
import { chatPrompt } from './prompt/chat-prompt'
import { executeCrossProjectTool } from './tools/chat-tools'

const MAX_APPROVAL_BLOCK_MS = 50_000

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

        const lockResult = await chatHelpers.conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ status: ChatConversationStatus.STREAMING })
            .where('id = :id AND status != :streaming', { id: conversationId, streaming: ChatConversationStatus.STREAMING })
            .execute()
        if (lockResult.affected === 0) {
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
        const llmHistory = chatHistoryHygiene.collapseStaleToolOutputs({ messages: allMessages })

        const previousUiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
        const uiMessagesWithUser: PersistedChatMessage[] = [
            ...previousUiMessages,
            { role: PersistedChatRole.USER, parts: [{ type: PersistedChatPartType.TEXT, text: userMessage }] },
        ]
        await chatHelpers.conversationRepo().update(conversationId, {
            messages: allMessages,
            uiMessages: JSON.parse(JSON.stringify(uiMessagesWithUser)),
        })
        await chatApprovalGate.clearCancel({ conversationId })

        const estimatedTokens = chatCompaction.estimateTokenCount({ messages: llmHistory, systemPromptLength: systemPromptText.length })
        let compactionState = { summary: conversation.summary ?? null, summarizedUpToIndex: conversation.summarizedUpToIndex ?? null }

        if (chatCompaction.shouldCompact({ estimatedTokens, provider: providerConfig.provider, messageCount: llmHistory.length })) {
            const model = chatAiUtils.createChatModel({
                provider: providerConfig.provider,
                auth: providerConfig.auth as Record<string, unknown>,
                config: providerConfig.config as Record<string, unknown>,
                modelId: resolvedModelId,
            })
            compactionState = await chatCompaction.compactMessages({
                messages: llmHistory,
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
            messages: llmHistory,
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
            guides: chatPrompt.loadGuides(),
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

        const saveResult = await chatHelpers.conversationRepo().update(input.conversationId, updates)
        if (saveResult.affected === 0) {
            log.warn({ conversationId: input.conversationId }, 'saveChatMessages: conversation not found, may have been deleted')
        }

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
    },

    async executeChatTool(input: ExecuteChatToolRequest): Promise<ExecuteChatToolResponse> {
        if (input.toolName === '__cancel_check') {
            const conversationId = input.toolInput.conversationId
            if (typeof conversationId !== 'string') {
                return { result: false }
            }
            const runId = typeof input.toolInput.runId === 'string' ? input.toolInput.runId : undefined
            if (runId) {
                const currentRunId = await chatApprovalGate.getActiveRunId({ conversationId })
                if (currentRunId === runId) {
                    await chatApprovalGate.storeActiveRunId({ conversationId, runId })
                }
            }
            const cancelled = await chatApprovalGate.isCancelled({ conversationId, runId })
            return { result: cancelled }
        }
        if (input.toolName === '__approval_wait') {
            const gateId = input.toolInput.gateId
            if (typeof gateId !== 'string') {
                return { result: 'pending' }
            }
            const rawTimeout = input.toolInput.timeoutMs
            const timeoutMs = Math.min(typeof rawTimeout === 'number' ? rawTimeout : MAX_APPROVAL_BLOCK_MS, MAX_APPROVAL_BLOCK_MS)
            const decision = await chatApprovalGate.waitForDecision({ gateId, timeoutMs })
            return { result: decision }
        }
        if (input.toolName === '__store_pending_gate') {
            const { conversationId: convId, gateId, toolName: gateTool, displayName, toolInput: gateInput } = input.toolInput
            if (typeof convId === 'string' && typeof gateId === 'string' && typeof gateTool === 'string') {
                await chatApprovalGate.storePendingGate({
                    conversationId: convId,
                    gate: {
                        gateId,
                        toolName: gateTool,
                        displayName: typeof displayName === 'string' ? displayName : gateTool,
                        toolInput: typeof gateInput === 'object' && gateInput !== null ? gateInput as Record<string, unknown> : {},
                    },
                })
            }
            return { result: { success: true } }
        }
        if (input.toolName === '__store_selected_connection') {
            const { pieceName, connectionExternalId, label, projectId } = input.toolInput
            if (typeof input.conversationId === 'string' && typeof pieceName === 'string' && typeof connectionExternalId === 'string') {
                await chatApprovalGate.storeSelectedConnection({
                    conversationId: input.conversationId,
                    pieceName,
                    externalId: connectionExternalId,
                    label: typeof label === 'string' ? label : connectionExternalId,
                    projectId: typeof projectId === 'string' ? projectId : '',
                })
            }
            return { result: { success: true } }
        }
        if (input.toolName === '__get_available_connections') {
            const { pieceName } = input.toolInput
            if (typeof input.conversationId === 'string' && typeof pieceName === 'string') {
                const connections = await chatApprovalGate.getAvailableConnections({ conversationId: input.conversationId, pieceName })
                return { result: connections }
            }
            return { result: [] }
        }

        const result = await executeCrossProjectTool({
            toolName: input.toolName,
            toolInput: input.toolInput,
            platformId: input.platformId,
            userId: input.userId,
            conversationId: input.conversationId,
            log,
        })
        return { result }
    },
})
